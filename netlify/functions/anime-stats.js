const fetch = require("node-fetch");

let lastGoodData = null; // stays in memory while function is warm
let lastGoodData = null;

exports.handler = async function () {
  const query = `
@@ -19,6 +19,24 @@ exports.handler = async function () {
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

@@ -27,7 +45,6 @@ exports.handler = async function () {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Bearer " + process.env.ANILIST_TOKEN
      },
      body: JSON.stringify({ query })
@@ -37,46 +54,50 @@ exports.handler = async function () {
    if (!data.data) throw new Error("No data from AniList");

    const animeStats = data.data.Viewer.statistics.anime;
    lastGoodData = animeStats; // ✅ store it for next time
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
      body: JSON.stringify(animeStats)
      body: JSON.stringify(result)
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
        body: JSON.stringify({ ...lastGoodData, cached: true })
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
