const fetch = require("node-fetch");

let lastGoodData = null; // stays in memory while function is warm

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
    if (!data.data) throw new Error("No data from AniList");

    const animeStats = data.data.Viewer.statistics.anime;
    lastGoodData = animeStats; // ✅ store it for next time

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

    if (lastGoodData) {
      // ✅ Serve cached data if available
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: JSON.stringify({
          ...lastGoodData,
          cached: true, // add flag so frontend knows it’s cached
        })
      };
    }

    // ❌ Nothing cached yet, return fallback
    return {
      statusCode: 200,
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
