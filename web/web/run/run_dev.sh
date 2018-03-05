#!/bin/bash
#gulp
source venv/bin/activate
python3 manage.py collectstatic --no-input
ETH_NETWORK_NAME=3 INFURA_URL=https://ropsten.infura.io/NUN4gYEmsfhHa6fGl8G1 NODE_ENV=development DEV=true python3 manage.py runserver localhost:7000
