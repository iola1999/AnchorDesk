function isClosedStreamError(error: unknown) {
  return (
    error instanceof TypeError &&
    (error as TypeError & { code?: string }).code === "ERR_INVALID_STATE"
  );
}

export function createSseWriter(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) {
  let closed = false;

  const write = (chunk: string) => {
    if (closed) {
      return false;
    }

    try {
      controller.enqueue(encoder.encode(chunk));
      return true;
    } catch (error) {
      if (isClosedStreamError(error)) {
        closed = true;
        return false;
      }

      throw error;
    }
  };

  return {
    isClosed: () => closed,
    event: (name: string, payload: unknown, id?: string | null) =>
      write(
        `${id ? `id: ${id}\n` : ""}event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`,
      ),
    comment: (text: string) => write(`: ${text}\n\n`),
    close: () => {
      if (closed) {
        return false;
      }

      closed = true;

      try {
        controller.close();
        return true;
      } catch (error) {
        if (isClosedStreamError(error)) {
          return false;
        }

        throw error;
      }
    },
    error: (error: unknown) => {
      if (closed) {
        return false;
      }

      closed = true;

      try {
        controller.error(error);
        return true;
      } catch (controllerError) {
        if (isClosedStreamError(controllerError)) {
          return false;
        }

        throw controllerError;
      }
    },
  };
}
