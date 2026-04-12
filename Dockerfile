FROM golang:1.25.1-alpine AS builder

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/yijing .

FROM alpine:3.21

WORKDIR /app

COPY --from=builder /out/yijing /app/yijing
COPY book /app/book

ENV ADDR=:8088
ENV BOOK_DIR=/app/book

EXPOSE 8088

CMD ["/app/yijing"]
