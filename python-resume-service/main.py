import os
import tempfile
from typing import Any, Dict, List

from fastapi import FastAPI, File, HTTPException, UploadFile
from pyresparser import ResumeParser

app = FastAPI(title="Resume Parser Service")


def _normalize_experience(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (int, float)):
        return f"{value} years"
    return str(value)


def _normalize_education(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if str(item).strip()]
        return ", ".join(cleaned)
    return str(value)


@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)) -> Dict[str, Any]:
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files are supported.")

    suffix = os.path.splitext(file.filename or "resume.pdf")[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = temp_file.name
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")
        temp_file.write(content)

    try:
        extracted = ResumeParser(temp_path).get_extracted_data() or {}
        skills: List[str] = extracted.get("skills") or []

        return {
            "name": extracted.get("name") or "",
            "email": extracted.get("email") or "",
            "skills": [str(skill).strip() for skill in skills if str(skill).strip()],
            "experience": _normalize_experience(extracted.get("total_experience")),
            "education": _normalize_education(extracted.get("degree")),
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {exc}") from exc
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass
