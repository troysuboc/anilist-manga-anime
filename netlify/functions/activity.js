const fetch = require("node-fetch");

exports.handler = async function () {
  const query = `
    query {
      Page(perPage: 10) {   # grab more so we can filter down
        activities(userId: 144919, sort: ID_DESC) {
          ... on ListActivity {
            status
            progress
            media {
              type       # 👈 anime or manga
              title {
                romaji
              }
              coverImage {
                large
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
        "Accept": "application/json",
        "Authorization": "Bearer " + process.env.ANILIST_TOKEN
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (!data.data) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type"
        },
        body: JSON.stringify({ error: "No data from AniList" })
      };
    }

    // ✅ Filter only manga
    const mangaActivities = data.data.Page.activities
      .filter(act => act.media && act.media.type === "MANGA")
      .slice(0, 3) // only keep 3 most recent manga
      .map(act => ({
        title: act.media.title.romaji,
        cover: act.media.coverImage.large,
        status: act.status,
        progress: act.progress
      }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ activities: mangaActivities })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ error: err.message })
    };
  }
};
