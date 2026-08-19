import {
  livePosition,
  MIX_OBJECT_KEY,
  MIX_PATH,
  parseDurationSeconds,
  STATION,
} from "./station";

function isR2ObjectBody(object: R2Object | R2ObjectBody): object is R2ObjectBody {
  return "body" in object;
}

function mixHeaders(object: R2Object, partial: boolean): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=3600");
  headers.set("Content-Type", "audio/mpeg");

  if (partial && object.range) {
    const offset = "offset" in object.range && object.range.offset ? object.range.offset : 0;
    const length =
      "length" in object.range && object.range.length != null
        ? object.range.length
        : object.size - offset;
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("Content-Length", String(length));
  } else {
    headers.delete("Content-Range");
    headers.set("Content-Length", String(object.size));
  }

  return headers;
}

async function serveMix(request: Request, bucket: R2Bucket): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rangeHeader = request.headers.get("Range");
  const object = await bucket.get(
    MIX_OBJECT_KEY,
    request.method === "HEAD"
      ? { range: { offset: 0, length: 1 } }
      : rangeHeader
        ? { range: request.headers }
        : undefined,
  );

  if (!object) {
    return new Response("Mix not found", { status: 404 });
  }

  const partial = Boolean(rangeHeader && object.range);
  const headers = mixHeaders(object, partial);

  if (request.method === "HEAD") {
    headers.delete("Content-Range");
    headers.set("Content-Length", String(object.size));
    return new Response(null, { status: 200, headers });
  }

  if (!isR2ObjectBody(object)) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(object.body, {
    status: partial ? 206 : 200,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/station") {
      const durationSeconds = parseDurationSeconds(env.DURATION_SECONDS);
      const configuredUrl = env.AUDIO_PUBLIC_URL || MIX_PATH;
      const audioUrl = configuredUrl === MIX_PATH ? `${MIX_PATH}?v=2` : configuredUrl;

      return Response.json({
        id: STATION.id,
        name: STATION.name,
        title: STATION.title,
        audioUrl,
        durationSeconds,
        positionSeconds: livePosition(durationSeconds),
      });
    }

    if (url.pathname === MIX_PATH) {
      return serveMix(request, env.AUDIO);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
