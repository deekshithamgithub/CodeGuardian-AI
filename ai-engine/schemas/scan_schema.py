from pydantic import BaseModel, Field
from typing import Literal


class ScanRequest(BaseModel):
    code: str = Field(min_length=1, max_length=50000)
    language: Literal["python", "javascript"]


class ExplainRequest(BaseModel):
    code: str = Field(min_length=1, max_length=50000)
    issue: dict