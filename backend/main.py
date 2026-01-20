from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import auth, user, story, paragraph, class_router, circuit, challenge
from database import create_db_and_tables
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_db_and_tables()
    yield
    # Shutdown (if needed)

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.on_event("startup")
# def on_startup():
#     create_db_and_tables()


app.include_router(auth.router)
app.include_router(user.router)
app.include_router(circuit.router)
app.include_router(challenge.router)
app.include_router(story.router)
app.include_router(paragraph.router)
app.include_router(class_router.router)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)