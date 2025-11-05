import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal, Optional
from scipy.stats import norm
from scipy.optimize import brentq

OptionType = Literal["call", "put"]

@dataclass
class Inputs:
    option_price: float
    S0: float
    K: float
    expiry: datetime
    opt_type: OptionType
    r: float = 0.0
    q: float = 0.0

def yearfrac(now: datetime, expiry: datetime) -> float:
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    return max((expiry - now).total_seconds() / (365*24*3600), 1e-8)

def bs_price(S, K, T, r, q, sigma, opt_type: OptionType):
    d1 = (math.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*math.sqrt(T))
    d2 = d1 - sigma*math.sqrt(T)
    if opt_type == "call":
        return S*math.exp(-q*T)*norm.cdf(d1) - K*math.exp(-r*T)*norm.cdf(d2)
    else:
        return K*math.exp(-r*T)*norm.cdf(-d2) - S*math.exp(-q*T)*norm.cdf(-d1)

def implied_vol(price, S, K, T, r, q, opt_type: OptionType) -> Optional[float]:
    def f(sigma): return bs_price(S, K, T, r, q, sigma, opt_type) - price
    try:
        return brentq(f, 1e-6, 5.0, maxiter=200)
    except ValueError:
        print(opt_type)
        return None

def prob_finish_itm(S, K, T, r, q, sigma, opt_type: OptionType) -> float:
    d1 = (math.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*math.sqrt(T))
    d2 = d1 - sigma*math.sqrt(T)
    return norm.cdf(d2) if opt_type == "call" else norm.cdf(-d2)

def prob_touch(S, K, T, r, q, sigma, opt_type: OptionType) -> float:
    """Reflection principle closed-form hitting probability."""
    if (opt_type == "call" and K <= S) or (opt_type == "put" and K >= S):
        return 1.0  # already touched
    d1 = (math.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*math.sqrt(T))
    d2 = d1 - sigma*math.sqrt(T)
    exponent = 2*(r-q)/sigma**2
    if opt_type == "call":
        return (S/K)**exponent * norm.cdf(d1) + norm.cdf(d2)
    else:
        return (K/S)**exponent * norm.cdf(-d1) + norm.cdf(-d2)

def odds_from_market_price(params: Inputs, now: Optional[datetime]=None):
    now = now or datetime.now(timezone.utc)
    T = yearfrac(now, params.expiry)
    iv = implied_vol(params.option_price, params.S0, params.K, T, params.r, params.q, params.opt_type)
    if iv is None:
        raise ValueError("Could not infer implied volatility. Check inputs.")
    return {
        "time_to_expiry_years": T,
        "implied_vol": iv,
        "prob_finish_ITM": prob_finish_itm(params.S0, params.K, T, params.r, params.q, iv, params.opt_type),
        "prob_touch_before_expiry": prob_touch(params.S0, params.K, T, params.r, params.q, iv, params.opt_type)
    }
