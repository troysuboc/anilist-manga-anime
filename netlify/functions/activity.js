const fetch = require("node-fetch");

exports.handler = async function () {
  const query = `
    query {
      Page(perPage: 15) {   # 👈 fetch more to ensure enough manga
        activities(userId: 144919, sort: ID_DESC) {
          ... on ListActivity {
            status
            progress
            media {
              type
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

    // ✅ Filter only manga + take 5 most recent
    const mangaActivities = data.data.Page.activities
      .filter(act => act.media && act.media.type === "MANGA")
      .slice(0, 5)
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
