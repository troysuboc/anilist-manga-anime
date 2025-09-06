const fetch = require("node-fetch");

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
    }
  `;

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Bearer " + process.env.ANILIST_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (!data.data) {
      throw new Error("No data from AniList");
    }

    const animeStats = data.data.Viewer.statistics.anime;

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify(animeStats)
    };
  } catch (err) {
    console.error("AniList API error:", err.message);

    // ✅ Fallback object so frontend still has something
    return {
      statusCode: 200, // still return 200, not 500
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({
        count: "N/A",
        episodesWatched: "N/A",
        meanScore: "N/A",
        minutesWatched: "N/A",
        error: "AniList unavailable"
      })
    };
  }
};
