FROM oven/bun:1 as builder

WORKDIR /app

COPY src/index.ts package.json ./
RUN bun install --production && \
    bun build src/index.ts --compile --outfile app && \
    chmod +x app


FROM scratch

COPY --from=builder /app/app /app

COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

EXPOSE 3000

USER nobody:nobody

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/app", "--health"]

CMD ["/app"]