const webhookURL = "https://discord.com/api/webhooks/1303408305678323805/bsCPnk_3qdiEC45bT922ztRNCmcUzk_OKimW8vcnGs8REkZVlJFfhM4BSBOf2ca_4nqw";
const intensity_list = ["0", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"];
const intensity_icon = ["⚫", "⚪", "🟢", "🟡", "🟠", "🟠", "🔴", "🟤", "🟣", "🟪"];
const intensityData = {};

class Plugin {
  #ctx;

  constructor(ctx) {
    this.#ctx = ctx;
  }

  onLoad() {
    const { TREM, logger, MixinManager } = this.#ctx;
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");

      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    };

    const _onReportRelease = (original, ...args) => {
      logger.info("Refreshing reports...");

      let info_msg = "";
      let maxIntensity = 0;

      const result = original(...args);
      const data = { ...args }[0].data;
      const id = data.id.split("-")[0];
      const loc = data.loc;
      const dep = data.depth;
      const lat = data.lat;
      const lon = data.lon;
      const mag = data.mag;
      const time = formatTime(data.time);
      const list = data.list;

      for (const city in list) {
        const townObject = list[city].town;
        for (const town in townObject) {
          const townDetails = townObject[town];
          let intensity = intensity_list[townDetails.int];
          intensity = intensity.includes("⁺") || intensity.includes("⁻")
            ? intensity.replace("⁺", "強").replace("⁻", "弱")
            : intensity;
          if (!intensityData[townDetails.int])
            intensityData[townDetails.int] = {};
          if (!intensityData[townDetails.int][city])
            intensityData[townDetails.int][city] = [];
          intensityData[townDetails.int][city].push(town);
          if (townDetails.int > maxIntensity)
            maxIntensity = townDetails.int;
        }
      }

      const sortedIntensities = Object.keys(intensityData).sort((a, b) => b - a);
      sortedIntensities.forEach((intensity) => {
        const cityGroups = intensityData[intensity];
        let intensityLabel = intensity_list[intensity];
        intensityLabel = intensityLabel.includes("⁺") || intensityLabel.includes("⁻")
          ? intensityLabel.replace("⁺", "強").replace("⁻", "弱")
          : intensityLabel;
        const cityMessages = Object.keys(cityGroups).map((city) => `${city}(${cityGroups[city].join("、")})`).join("\n");
        info_msg += `[${intensity ? intensity_icon[intensity] : ""}震度${intensityLabel}]\n${cityMessages}\n\n`;
      });

      let max = intensity_list[maxIntensity];
      max = max.includes("⁺") || max.includes("⁻")
        ? max.replace("⁺", "強").replace("⁻", "弱")
        : max;

      const message = {
        color       : 0xff9900,
        title       : "地震報告",
        url         : "",
        author      : { name: "", icon_url: "" },
        description : `${time} 發生規模${mag}地震，最大震度${max}。`,
        thumbnail   : { url: "" },
        fields      : [
          { name: "編號", value: `\`\`\`${id}\`\`\``, inline: true },
          { name: "發震時間", value: `\`\`\`${time}\`\`\``, inline: true },
          {
            name   : "最大震度",
            value  : `\`\`\`${max}${intensity_icon[maxIntensity]}\`\`\``,
            inline : true,
          },
          { name: "震央", value: `\`\`\`${loc}\`\`\``, inline: true },
          { name: "規模", value: `\`\`\`${mag}\`\`\``, inline: true },
          { name: "深度", value: `\`\`\`${dep}公里\`\`\``, inline: true },
          {
            name   : "緯度",
            value  : `\`\`\`${lat.toString()}\`\`\``,
            inline : true,
          },
          {
            name   : "經度",
            value  : `\`\`\`${lon.toString()}\`\`\``,
            inline : true,
          },
          {
            name   : "各地震度",
            value  : `\`\`\`${info_msg}\`\`\``,
            inline : false,
          },
        ],
        timestamp : new Date().toISOString(),
        footer    : {
          text: "POWER BY miyashooooo",
          icon_url:
          "https://cdn.discordapp.com/avatars/789742073036144640/6d5243e3004c334dd930895140fea744.webp?size=300",
        },
      };


      fetch(webhookURL, {
        method  : "POST",
        headers : {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username   : "My Bot",
          avatar_url : "https://example.com/avatar.png",
          embeds     : [message],
        }),
      })
        .then(response => {
          if (response.ok)
            console.log("Webhook 發送成功！");
          else
            console.error("Webhook 發送失敗", response.statusText);

        })
        .catch(error => console.error("發送 Webhook 時發生錯誤:", error));

      logger.info("Reports refreshed");
      return result;
    };

    logger.info("Loading example plugin...");

    MixinManager.inject(
      TREM.class.ReportManager,
      "onReportRelease",
      _onReportRelease,
      0,
    );
  }
}

module.exports = Plugin;
