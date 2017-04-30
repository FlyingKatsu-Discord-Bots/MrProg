// ===============================================
// Factory NPC properties (to copy or overwrite)
// ===============================================
var FactoryNPC = function( input ) {
  this.name = input.name || "NPC";
  this.webhookID = input.webhookID || "308032162735587328";
  this.color = input.color || {
    normal: "#70C040",
    warning: "#FAA61A",
    error: "#DF6777"
  };
  this.img = input.img || {
    normal: "https://cdn.pbrd.co/images/hXrbGDHil.png",
    warning: "https://cdn.pbrd.co/images/hXrbGDHil.png",
    error: "https://cdn.pbrd.co/images/hXrbGDHil.png"
  };
  this.dialogue = input.dialogue || {};
};


// ===============================================
// Factory NPC methods (for prototypal inheritance)
// ===============================================
FactoryNPC.prototype.getEmbed = function( imgID, colorID, text, foot, title, image ) {
  return {
    title: this.name,
    desc: text,
    thumb: this.img[imgID],
    color: this.color[colorID],
    foot: foot,
    author: title,
    imgurl: image
  };
};
FactoryNPC.prototype.getDialogue = function( situation ) {
  if (situation === "random") {
    let sit = Math.floor( Math.random() * 10 ) % Object.keys(this.dialogue).length;
    return this.dialogue.random[sit];
  } else {
    return this.dialogue[situation];
  }
};
FactoryNPC.prototype.sendMessage = function( client, msg ) {
  client.fetchWebhook(this.webhookID)
    .then( (webhook) => webhook.sendMessage(msg))
    .catch( console.error );
}


// ===============================================
// Factory NPC Instantiation (new instances)
// ===============================================

// Object to export to Node.JS app
var NPC = {
  
  // Main responder for the bot
  guide: new FactoryNPC ( {
    name: "Mr.Prog",
    webhookID: "308032162735587328",
    dialogue: {
      tips_battle: "This is the battle channel! It's still under construction...",
      tips_shop: "This is the shop channel! It's still under construction...",
      random: ["HELLO, I AM THE MR.PROG BOT",
              "Ssssss, sssssshhh!!",
              "I'm so sleepy... zzz",
              "La la la lala laa~"
              ]
    }
  } ),
  
  // Battle responder for the bot
  announcer: new FactoryNPC ( {
    name: "NetOfficial",
    webhookID: "308032053436481536",
    color: {
      normal: "#609088",
      warning: "#E07828",
      error: "#E89018"
    },
    img: {
      normal: "http://flyingkatsu.com/dsc/BattleNetworkFK/avatars/Official/NetOfficial.png",
      warning: "http://flyingkatsu.com/dsc/BattleNetworkFK/avatars/Official/NetOfficial.png",
      error: "http://flyingkatsu.com/dsc/BattleNetworkFK/avatars/Official/NetPolice.png"
    },
    dialogue: {
      tips_battle: "This is the battle channel! It's still under construction...",
      random: ["..."
              ]
    }
  } ),
  
  // Shop responder for the bot
  dealer: new FactoryNPC ( {
    name: "NetDealer",
    webhookID: "308032117072330752",
    color: {
      normal: "#7840A8",
      warning: "#DF6777",
      error: "#FAA61A"
    },
    img: {
      normal: "http://flyingkatsu.com/dsc/BattleNetworkFK/avatars/Generic/Egg.png",
      warning: "http://flyingkatsu.com/dsc/BattleNetworkFK/avatars/Generic/Egg.png",
      error: "http://flyingkatsu.com/dsc/BattleNetworkFK/avatars/Generic/Egg.png"
    },
    dialogue: {
      tips_shop: "Wanna see my wares?\n\nJust kidding! I don't have anything yet.",
      random: ["...what?"
              ]
    }
  } )
  
};

if (Object.freeze) Object.freeze(NPC);
module.exports = NPC;