const fetch = require("node-fetch");

let lastGoodData = null;

exports.handler = async function () {
  const statsQuery = `
    query {
      Viewer {
        statistics {
          anime {
            count
            episodesWatched
            meanScore
            minutesWatched
            statuses {
              status
              count
            }
          }
        }
      }
    }
  `;

  const activitiesQuery = `
    query {
      Page(perPage: 5) {
        activities(mediaType: ANIME, sort: ID_DESC) {
          ... on ListActivity {
            status
            progress
            media {
              title {
                romaji
                english
              }
              coverImage {
                medium
              }
            }
          }
        }
      }
    }
  `;

  async function runQuery(query) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.ANILIST_TOKEN
      },
      body: JSON.stringify({ query })
    });
    return res.json();
  }

  try {
    const [statsRes, activitiesRes] = await Promise.all([
      runQuery(statsQuery),
      runQuery(activitiesQuery)
    ]);

    if (!statsRes.data && !activitiesRes.data) {
      throw new Error("No data from AniList");
    }

    const animeStats = statsRes.data?.Viewer?.statistics?.anime || {};
    const activities = (activitiesRes.data?.Page?.activities || []).map(act => ({
      title: act.media?.title?.english || act.media?.title?.romaji || "Untitled",
      cover: act.media?.coverImage?.medium || "",
      status: act.status || "",
      progress: act.progress || ""
    }));

    const result = { stats: animeStats, activities };
    lastGoodData = result;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error("AniList API error:", err.message);
    if (lastGoodData) {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: JSON.stringify({ ...lastGoodData, cached: true })
      };
    }
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({
        stats: {
          count: "N/A",
          episodesWatched: "N/A",
          meanScore: "N/A",
          minutesWatched: "N/A"
        },
        activities: [],
        error: "AniList unavailable"
      })
    };
  }
};
