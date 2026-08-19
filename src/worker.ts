import {
  livePosition,
  parseDurationSeconds,
  STATION,
} from "./station";

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/station") {
      const durationSeconds = parseDurationSeconds(env.DURATION_SECONDS);
      const audioUrl = env.AUDIO_PUBLIC_URL || "/merged-audio.mp3";

      return Response.json({
        id: STATION.id,
        name: STATION.name,
        title: STATION.title,
        audioUrl,
        durationSeconds,
        positionSeconds: livePosition(durationSeconds),
      });
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
