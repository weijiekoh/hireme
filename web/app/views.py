import os
import json
import web3

from django.conf import settings

from web3.contract import ConciseContract

from django.shortcuts import render
from project import settings
from django.http import JsonResponse

from web3 import Web3, HTTPProvider


def index(request):
    return render(request, "app/index.html", {"DEBUG": settings.DEBUG})


def bids(request):
    rpc_url = None
    network_name = None
    if settings.DEBUG:
        rpc_url = "http://localhost:8545"
        network_name = "5777"
    else:
        rpc_url = os.environ["INFURA_URL"]
        network_name = "1"

    path = os.path.join(os.path.dirname(__file__),
                        "../../build/contracts/HireMe.json")
    compiled_sol = json.loads(open(path).read())
    contract_interface = compiled_sol

    w3 = Web3(HTTPProvider(rpc_url))
    contract_address = compiled_sol["networks"][network_name]["address"]
    cc = w3.eth.contract(contract_interface['abi'],
                         contract_address,
                         ContractFactoryClass=ConciseContract)

    response = {"bids": []}
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
    
    return JsonResponse(response)
