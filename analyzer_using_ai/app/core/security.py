import os;
from secrets import compare_digest;
from fastapi import Header,HTTPException

def check_internal_token(x_internal_token:str| None = Header(default=None)) -> None:
    """Check if the request is coming from the internal Next.js server."""
    token = os.environ.get("AI_INTERNAL_TOKEN", "")
    if not token or not x_internal_token or not compare_digest(x_internal_token, token):
        raise HTTPException(status_code=403, detail="Forbidden")
