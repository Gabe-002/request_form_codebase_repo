from app.config import settings
import os, msal, requests

CLIENT_ID = settings.CLIENT_ID
TENANT_ID = settings.TENANT_ID
SITE_ID = settings.SITE_ID
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"

# The key and cert thumbprint are for the sharepoint rest api
SP_KEY_PATH = settings.SP_KEY_PATH
SP_CERT_THUMBPRINT = settings.SP_CERT_THUMBPRINT

CLIENT_SECRET = settings.CLIENT_SECRET

sp_hostname = "teichmanngrp.sharepoint.com"

# Certificate app instance, for SharePoint REST only
with open(SP_KEY_PATH, "r") as f:
    private_key = f.read()

graph_app = msal.ConfidentialClientApplication(
    client_id=CLIENT_ID, client_credential=CLIENT_SECRET, authority=AUTHORITY,
)

sp_rest_app = msal.ConfidentialClientApplication(
    client_id=CLIENT_ID,
    client_credential={"private_key": private_key, "thumbprint": SP_CERT_THUMBPRINT},
    authority=AUTHORITY,
)

def get_graph_token() -> str:
    result = graph_app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if "access_token" not in result:
        raise RuntimeError(result.get("error_description"))
    return result["access_token"]

def get_sp_rest_token(sp_hostname: str) -> str:
    result = sp_rest_app.acquire_token_for_client(scopes=[f"https://{sp_hostname}/.default"])
    if "access_token" not in result:
        raise RuntimeError(result.get("error_description"))
    return result["access_token"]

def get_site_url() -> str:
    token = get_graph_token()
    resp = requests.get(
        f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}",
        headers={"Authorization": f"Bearer {token}"},
    )
    resp.raise_for_status()
    return resp.json()["webUrl"]

# Here we are getting the user ID for that site collection from the user information lists
def ensure_user(email: str, site_url: str = None) -> int:
    if site_url is None:
        site_url = get_site_url()

    sp_hostname = site_url.split("/")[2]
    token = get_sp_rest_token(sp_hostname)

    url = f"{site_url}/_api/web/ensureuser"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json;odata=verbose",
        "Accept": "application/json;odata=verbose",
    }
    body = {"logonName": f"i:0#.f|membership|{email}"}

    response = requests.post(url, headers=headers, json=body)
    if not response.ok: return None

    return response.json()["d"]["Id"]

def call_graph_api(url, method="GET", json_body=None):
    access_token = get_graph_token()
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "apiversion=2.1"
    }

    response = requests.request(url=url, method=method, headers=headers, json=json_body)
    if not response.ok:
        print("Shit did not go as intended")
    return response




if __name__ == "__main__":

    # from app.database import get_db
    # from app.infotech.services.infotech_database import get_delta_link
    # from app.infotech.services.infotech_database import add_tenant_user
    # from app.infotech.models import CreateTenantUser

    # #Here are some usefull ursls
    # deltaLink = None
    # url = "https://graph.microsoft.com/v1.0/users/delta?$select=id,displayName,mail,userPrincipalName,accountEnabled"
    # members = []
    # while(url):
    #     response = call_graph_api(url=url)
    #     results = response.json().get('value')
    #     members.extend(results)
    #     url = response.json().get('@odata.nextLink')
    # deltaLink = response.json().get('@odata.deltaLink')
    # teichmanngrp_members = [
    #     member 
    #     for member in members 
    #     if 'teichmanngrp' in (member.get('mail', '') or member.get('userPrincipalName') or '')
    # ]

    # columnMapping = {
    #     "displayName": "display_name",
    #     "mail": "email",
    #     "accountEnabled": "account_enabled",
    #     "id": "graph_id",
    #     "userPrincipalName": "upn"
    # }
    # formatted_teichmanngrp_members = []
    # for member_info in teichmanngrp_members:
    #     info = {}
    #     for key, value in columnMapping.items():
    #         info[value] = member_info.get(key)
    #     formatted_teichmanngrp_members.append(info)
    

    # db = get_db()
    # db = next(db)

    # for member_info in formatted_teichmanngrp_members:
    #     add_tenant_user(db, CreateTenantUser(**member_info))

    # print(deltaLink)

    print(ensure_user('PrettyPrinces.Gabriel@teichmanngrp.com'))