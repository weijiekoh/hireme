import os
import datetime
import json

from web3 import Web3, HTTPProvider
from web3.contract import ConciseContract

from django.conf import settings
from django.shortcuts import render
from project import settings
from django.http import JsonResponse



def index(request):
    return render(request, "app/index.html", {"DEBUG": settings.DEBUG})


def bids(request):
    rpc_url = None
    network_name = None

    if "INFURA_URL" not in os.environ:
        rpc_url = "http://localhost:8545"
        network_name = "5777"
    else:
        rpc_url = os.environ["INFURA_URL"]
        network_name = os.environ["ETH_NETWORK_NAME"]

    contract_interface = settings.CONTRACT_INTERFACE
    contract_address = contract_interface["networks"][network_name]["address"]

    w3 = Web3(HTTPProvider(rpc_url))
    cc = w3.eth.contract(contract_interface['abi'],
                         contract_address,
                         ContractFactoryClass=ConciseContract)

    response = {}

    manually_ended = cc.manuallyEnded()
    if manually_ended:
        response["manuallyEnded"] = True
    else:
        response["bids"] = []

        bidIds = cc.getBidIds()
        for bidId in bidIds:
            bid = cc.bids(bidId)
            exists = bid[0]
            assert(exists)
            assert(bid[1] == bidId)

            response["bids"].append({
                "timestamp": bid[2],
                "bidder": bid[3],
                "amount": bid[4],
                "organisation": bid[6]
            })
        
        if len(bidIds) > 0:
            response["expiryTimestamp"] = cc.expiryTimestamp()

    r = JsonResponse(response)
    r["Cache-Control"] = "no-cache"
    return r
