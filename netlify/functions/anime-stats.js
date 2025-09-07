const fetch = require("node-fetch");

let lastGoodData = null;

exports.handler = async function () {
  const query = `
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
      Page(perPage: 10) {
        activities(mediaType: ANIME, sort: ID_DESC) {
          ... on ListActivity {
            status
            progress
            createdAt
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

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.ANILIST_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    if (!data.data) throw new Error("No data from AniList");

    const animeStats = data.data.Viewer.statistics.anime;
    const activities = (data.data.Page?.activities || []).map(act => ({
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
