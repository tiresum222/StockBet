import requests
from polygon import WebSocketClient
from polygon import RESTClient
from polygon.websocket.models import WebSocketMessage, Feed, Market
from typing import List
import json
from rich.live import Live
from rich.console import Console
from rich.table import Table
from InquirerPy import inquirer
import threading
from datetime import datetime
from math import log, sqrt, exp
from scipy.stats import norm
from poc.odds_calculator import odds_from_market_price, Inputs
from datetime import datetime, timedelta

API_KEY = ""
REST_URL = "https://api.polygon.io/v3/snapshot/options/"
WS_URL = "wss://delayed.polygon.io/options"

console = Console()

def calculate_end_of_week():
    """Find the closest Friday expiry."""
    today = datetime.today()
    days_ahead = 4 - today.weekday()  # Friday = 4
    if days_ahead < 0:
        days_ahead += 7
    expiry = today + timedelta(days=days_ahead)
    return expiry.strftime("%y%m%d")

def get_current_price(ticker):
    client = RESTClient("P2PGDpa9tAnjTbBm9JpBY9R909RbzUIy")
    stockInfo = client.get_snapshot_ticker("stocks", ticker)
    # check if today is a market holiday, if so, grab yesterday's close
    if stockInfo.day.close == 0:
        return stockInfo.prev_day.close
    return stockInfo.day.close

def get_line(prob_finish_ITM):
    decimal = 1 / prob_finish_ITM
    if decimal >= 2:
        line = (decimal - 1) * 100
        return "+"+str(round(line))
    else:
        line = -100 / (decimal - 1)
        return round(line)

def get_modified_option_price(option_price, current_price, strike, opt_type):
    if opt_type == "call":
        arbitrage_price = max(0, current_price - strike)
    elif opt_type == "put":
        arbitrage_price = max(0, strike - current_price)
    return max(option_price, arbitrage_price+.01)

def display_live_table(ticker):
    current_price = get_current_price(ticker)
    console.print(f"[yellow]{ticker} Current Price: {current_price}[/yellow]")

    http_client = RESTClient(API_KEY)
    
    step = 5  # $5 increments
    strikes = []
    base_strike = round(current_price / step) * step
    for offset in range(-5, 6):
        strikes.append(base_strike + offset * step)

    expiry = calculate_end_of_week()
    # table info contains the ticker, expiry, current price, and initial option values
    table_info = {}
    table_info["ticker"] = ticker
    table_info["expiry"] = expiry
    table_info["current_price"] = current_price
    initial_values = []
    for strike in strikes:
        
        call_option_price = float(http_client.get_snapshot_option(ticker, f"O:{ticker}{expiry}C{strike:05d}000").day.close)
        call_option_price = get_modified_option_price(call_option_price, current_price, strike, "call")
        call_option_inputs = Inputs(
            option_price=call_option_price,
            S0=float(current_price),
            K=float(strike),
            expiry=datetime.strptime(expiry, "%y%m%d"),
            opt_type="call",
            r=0.0,  # Example risk-free rate, adjust as needed
            q=0.0  # Example volatility, adjust as needed
        )
        put_option_inputs = Inputs(
            option_price=float(http_client.get_snapshot_option(ticker, f"O:{ticker}{expiry}P{strike:05d}000").day.close),
            S0=float(current_price),
            K=float(strike),
            expiry=datetime.strptime(expiry, "%y%m%d"),
            opt_type="put",
            r=0.0,  # Example risk-free rate, adjust as needed
            q=0.0  # Example volatility, adjust as needed
        )
        
        initial_values.append({
            "call": get_line(odds_from_market_price(call_option_inputs)['prob_finish_ITM']),
            "put": get_line(odds_from_market_price(put_option_inputs)['prob_finish_ITM']),
            "strike": float(strike)
        })
    table_info["initial_values"] = initial_values

    table = Table(title="End-of-Week Lines")
    table.add_column("Ticker", justify="right")
    table.add_column("Target Price", justify="right")
    table.add_column("Over Line", justify="center")
    table.add_column("Under Line", justify="center")
    
    #filling in the table with all of the lines
    for opt in table_info["initial_values"]:
        table.add_row(
            str(table_info["ticker"]),
            str(opt["strike"]),
            str(opt["call"]),
            str(opt["put"])
        )
    console.print(table)
    return table


def place_bet(table):
    strike = 0
    row = 0
    while True:
        strike = inquirer.text(
            message="Select a target price:"
        ).execute()
        if round(float(strike), 2) in [round(float(cell), 2) for cell in table.columns[1]._cells]:
            row = [round(float(cell), 2) for cell in table.columns[1]._cells].index(round(float(strike), 2))
            break

        console.print("[red]Invalid target price. Please select a valid target price from the table.[/red]")
    
    over_or_under = inquirer.select(
        message="Would you like to place an Over or Under bet?",
        choices=["Over", "Under"],
    ).execute()

    bet_amount = inquirer.text(
        message="How much would you like to bet in USD?"
    ).execute()

    line = table.columns[2 if over_or_under == "Over" else 3]._cells[row]

    payout = float(bet_amount) * (abs(float(line)) / 100) if float(line) > 0 else float(bet_amount) / (abs(float(line)) / 100)
    if float(line) > 0:
        payout += float(bet_amount)

    console.print(f"[green]Your potential profit is: ${payout:.2f}[/green]")
    return {
        "ticker": table.columns[0]._cells[row],
        "strike": table.columns[1]._cells[row],
        "over_or_under": over_or_under,
        "line": line,
        "bet_amount": float(bet_amount),
        "potential_payout": round(payout, 2)
    }

def display_users_betsheet(userBetSheet: List[dict]):
    if not userBetSheet:
        console.print("[yellow]Your bet sheet is currently empty.[/yellow]")
        return
    
    console.print("[blue]Your Current Bet Sheet:[/blue]")
    for i, bet in enumerate(userBetSheet, start=1):
        console.print(f"{i}. {bet['ticker']} - {bet['over_or_under']} {bet['strike']} at {bet['line']} line - Bet: ${bet['bet_amount']} - Potential Profit: ${bet['potential_payout']}")
        next_step = inquirer.select(
            message="What would you like to do?",
            choices=["Cancel Bet", "Return to Main Menu"],
        ).execute()
        if next_step == "Cancel Bet":
            userBetSheet.pop(i-1)
            console.print("[green]Bet successfully cancelled![/green]")
            break
        elif next_step == "Return to Main Menu":
            break
    
# main is responsible for the loop that allows users to place and cancel bets
def main():
    userBetSheet = []
    while True:
        next_step = inquirer.select(
            message="\nChoose from the below options:",
            choices=["Place Bet", "View/Edit Bets", "Exit"],
        ).execute()

        if next_step == "Place Bet":
            ticker = input("Enter a stock ticker (e.g., TSLA): ").upper()
            betting_table = display_live_table(ticker)
            bet = place_bet(betting_table)
            userBetSheet.append(bet)
            console.print("[green]Bet successfully added to your bet sheet![/green]")
        elif next_step == "View/Edit Bets":
            display_users_betsheet(userBetSheet)
        elif next_step == "Exit":
            console.print("[green]Goodbye and Goodluck![/green]")
            break


if __name__ == "__main__":
    main()
