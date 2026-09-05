from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tempfile
import pathlib
import subprocess
import sys

app = FastAPI(title="RenderCV Compiler API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RenderRequest(BaseModel):
    yaml_content: str

@app.post("/api/render")
async def render_pdf(req: RenderRequest):
    if not req.yaml_content.strip():
        raise HTTPException(status_code=400, detail="El contenido YAML no puede estar vacío.")

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = pathlib.Path(temp_dir)
        yaml_file = temp_path / "cv.yaml"
        yaml_file.write_text(req.yaml_content, encoding="utf-8")

        try:
            # Invocamos la CLI nativa de RenderCV mediante subprocess
            # Esto evita conflictos internos de módulos y funciona con cualquier versión de RenderCV v2
            result = subprocess.run(
                [sys.executable, "-m", "rendercv", "render", str(yaml_file)],
                cwd=temp_dir,
                capture_output=True,
                text=True
            )

            if result.returncode != 0:
                print("❌ Error compilando RenderCV:\n", result.stderr)
                raise HTTPException(
                    status_code=400, 
                    detail=f"Error en la sintaxis YAML de RenderCV: {result.stderr or result.stdout}"
                )

            # Buscar el archivo PDF en rendercv_output
            output_folder = temp_path / "rendercv_output"
            pdf_files = list(output_folder.glob("*.pdf"))

            if not pdf_files:
                raise HTTPException(status_code=500, detail="No se encontró el archivo PDF generado.")

            pdf_bytes = pdf_files[0].read_bytes()

            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": 'inline; filename="cv.pdf"'}
            )

        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            print("❌ Excepción en servidor:", str(e))
            raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)