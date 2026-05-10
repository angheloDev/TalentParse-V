@echo off
set PYTHON=C:\Users\ANGELO GALLEROS\AppData\Local\Programs\Python\Python314\python.exe
echo Starting resume parser service on http://localhost:8000
"%PYTHON%" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
