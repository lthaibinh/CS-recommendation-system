# --- Change the FROM line ---
FROM eclipse-temurin:17-jre 


RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-dev bash procps --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

WORKDIR $APP_HOME

COPY requirements.txt .
RUN pip install --break-system-packages --no-cache-dir -r requirements.txt

COPY . .


EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]