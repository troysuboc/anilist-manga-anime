const fetch = require("node-fetch");

exports.handler = async function () {
  const query = `
    query {
      Page(perPage: 3) {
        activities(userId: 144919, sort: ID_DESC) {
          ... on ListActivity {
            status
            progress
            media {
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
      return { statusCode: 500, body: JSON.stringify({ error: "No data from AniList" }) };
    }

    const activities = data.data.Page.activities.map(act => ({
      title: act.media.title.romaji,
      cover: act.media.coverImage.large,
      status: act.status,
      progress: act.progress
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ activities })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
