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


from app.database import get_db
from app.infotech.services.infotech_database import get_delta_link

if __name__ == "__main__":
    #Here are some usefull ursls
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
    #     if 'teichmanngrp' in (member.get('mail', '') or '')
    # ]

    # keyMapping = {
    #     "displayName": "display_name",
    #     "mail": "email",
    #     "id": "graph_id",
    #     "accountEnabled": "account_enabled"
    # }
    # formatted_teichmanngrp_members = []
    # for member_info in teichmanngrp_members:
    #     info = {}
    #     for key, value in keyMapping.items():
    #         info[value] = member_info[key]
    #     formatted_teichmanngrp_members.append(info)

    db = get_db()
    db = next(db)

    delta_link = get_delta_link(db)
    response = call_graph_api(delta_link)
    print(response.json())



    # response = call_graph_api('https://graph.microsoft.com/v1.0/users/delta?$deltatoken=JEbxJM6kn2_N-euX5b7cemV0Nymvl9e8vxN6sQYaYV8WXEBS6SSbi75XvO8IOk-XzRxER3h9zg1P8BIV9zmrgVucghC7IhcvaIsh__OtU9EzUn_yY9SkP5cUnpdtOuEFYBN7U5e-fMJ4kJD-ndm_F3FrQZAjkm1NlXEnWpBDwsWWQKfkW4SkEzKpJD8_41W6OM3Q8rqs_XFl80v7C1I_6sT4SJ0WDEw56RwKCHG_7zlVYk-reYcel9hhgCkz9lpceBGyo5AAV85F6Pvzum6jCqhdoZvsl6oE3V2SbEbVsXLcafPHZ0fhf89y_bTvGHUeU-vsrmMx4GtEAGgbrEwJ4FHw2qcSFYNauLtwEBbem_cksZ4kFEDA_3brJGwxxH5X5624OK_HVYOMflqN3jKaz8oAUJNuW3Tmy4JihS37EX4yrySVT8AIkkCpQKKIz-T5ylQBri26q61LbCSOa-NHJm1RNAGoEuxxZ7B5FZ72s4GMc3nBNcAFO7D_2EqLi2xfR_yEHaq0hGsZ5i0i7574Wp0UZhkxNA_1CJfh5DbORTMyy90LBIgnhg_yrJR-xpt-y4KrmAurR-GTGE8-3wdB4RFXR14K2BU6vsnwE26cr95eGSTM2CAuyBcJuHuR719GGEA97OeJm6TVSj6OeQArnCyLUL7ufAbT2msIBtDA3LFgSbVCszpFXQxQytZ58SqSCp6GwbgQKE0xz4o3vUZjpGeYj6VNVdQ0-HTqDNOaJm0g_8w210UAgE4fRfcp0eaK6u2rgOthfrGHbPzHxEXqeGJ_gnpl4chGm0z2hOGNwJur_bYeuqrm59B7sCwzx-4irwaQymJTCn_YA58efWzIgTo5ChlAAOu_vB8_95c1awwUactVBjIyQZACox7GXn1arGefeRDpl7S3G2uz2xDzIxoLIxTKh1NEqVeJ3n9YENeJDNKlV_a6lXv19FTdjMvhkWxW8dkHh1yU9x7GlPAFx4GxPHXmTbdp06mQgGuI0LAuJcTYWXFUzKq7u9LqQ5U_ni3ge_o7d2ZZhzBLjbv-CXHU9zxXyeS7-t9ewwuBtYc7MtqSi5Ap_FIq-8x343ougAEzySZMcXyy3ZOdFikThZBkyraqJH3A76NXDgi0ifUGfr7-upI-nd5RyxkIUy71ptg4BDoxiAKgKeBnBfbVxA3dh2aaZxG-pMUqk46eTov50OCKr_XHxRcaZNQtTq0o4RDTwJQYLYcZK9aVrWwDlK3am05hK-rx_ylZZ5wXFWOlwsKamcvGK9x44V-6g1o2V3cba7YxEw_QZRqChqrT1HD4u_jEl26KRhzelr3Qm2NzLp9vfavl4uBULMZ5SGR_guNXgEcPFf4Hszgf0nYS-5VCVVtFkc0jImnGDL_NnDof11eIl0mSdUW1_ksLtdpG8YmdCrQWQ1sPgS8nvF-xyC57us_bAKFB3erOQPBKLQGS17NFMmVg5u3YpXFxN3uaVgQEsRKPHsZrbNi0joUISBluIAXqPE1CwRy2VsCR6lGE4y3KATtl8rWp2NC8H8hV5Ftd2C2h0M3Dkm3SVF8oJIBQDPrlRwfa9nlToJ38cr2Ix2Xqsq7j37S4MUCRs5-I_1k9d9F_sIqrqxcyB6csBNj6RXIwGefm0bn0X94hOm_nOfEg05eqFY1K-h7KekvIn-0N--yBNLTyHBgQU-yVYt3YswMWmIi-v3vK5SJ9TLH0AbA75pZOwlYNIVr3veIseM4UC3KJBAKQcoZpdw2iwal6ycOgMGQTT0cV0tTis_h2JNJhIrBC84zgTt0atJ7uCbrNtQZEcRYKmV9AzkWmOPd7cFq6mK4ZcJNtiAzDDX9XK6S5W7AHxwrOWf4nzIVRhHAb0zVpVlfIAj6BWeEQvGd1wyrjgBlvdpOsEKiz5xAx9yHZFHyCPsmJme6yNz3KUfbfpUU4gJWAnjzuc9bIwqvcRfeLUH1Kf3B1R9-Z2tk_KVtxfpZWslfkjXbZJr6RGwUc8XSsWqGxnv8-M1YNYYRtzheSGsGGYaiGXI2nquRxdR4Mzp231F7ZxZfXj0fhB4PVvxl5t9UKhBe1qAPjjk7JsDN2vn1IaAPy6CgMAQdqGY4ZnqpCkqhVvDChLi182PKTrvGXC73cReOW6jsp-9cCzWfWJellbh1VqW66gaD9P9SqtgTVo2cDD17Oh0-5Kf0eSJhddEpBFKrDCIPmYM29Liox9_uElGvVs5Qu7zzNBSEs76qG0U4f7ATWklr4yTZTcwQBpYXBkV99vW9M-tzuSLfpMo5WZxeWfMp0ZoT6zoqBGRsFwTfcwpuVQR8HUBSt17xJUwEARFNhx3ei91-2Hexa70RT3rDfO0kq8JL25JdUr1X_mNY5sdQBgFZwDKdcLopRt53aofx3VxzWXHFmiXebq59ojkmBgtUdz21WqvIrFrPu0Dr4LIuUtSTlxTYomE0f5eIsCBbg0zCH6j3YzG7M30LVEMBjzpvCR3g.yN0jYXtGA5UpUgTFUmm1JTi5un2z0Ppa_QwC8wRXtKY')
    # print(response.json())