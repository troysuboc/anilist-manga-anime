const fetch = require("node-fetch");

let lastGoodData = null;

exports.handler = async function () {
  // Query to get viewer id + stats
  const statsQuery = `
    query {
      Viewer {
        id
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
    // Step 1: get stats + viewer id
    const statsRes = await runQuery(statsQuery);
    if (!statsRes.data?.Viewer) throw new Error("No Viewer data from AniList");

    const viewerId = statsRes.data.Viewer.id;
    const animeStats = statsRes.data.Viewer.statistics?.anime || {};

    // Step 2: fetch activities for that user id
    const activitiesQuery = `
      query {
        Page(perPage: 5) {
          activities(userId: ${viewerId}, sort: ID_DESC) {
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

    const activitiesRes = await runQuery(activitiesQuery);
    const activities = (activitiesRes.data?.Page?.activities || []).map(act => ({
      title: act.media?.title?.english || act.media?.title?.romaji || "Untitled",
      cover: act.media?.coverImage?.medium || "",
      status: act.status || "",
      progress: act.progress || ""
    }));

    // Step 3: return combined result
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
