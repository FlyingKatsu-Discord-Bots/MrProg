var CONFIG = {
  // Specify variable values
  botname: "Mr. Prog",      // 
  prefix: "?>",             // 
  partnerLabel: "NetNavi",  // 
  suffix: ".EXE",           // 
  game: "Discord",
  
  // Specify settings
  isDebugMode: true,    // If true, use the debugmode channels for now
  enableOC: false,      // If true, allows users to use any avatars they choose
  enforceSuffix: true,  // If true, all names will end with suffix specified above
  
  // Roles on this server
  roles: {
    partnered: "NetOps",  // 
    mod: "NetOfficials",  // 
    admin: "NetHost"      // 
  },
    
  // The ID of the server this bot should listen to
  guildID: null,
  
  // Specify bot-enabled channel IDs for the given server
  channels: {
    
    // Channels that are null will default to main (or debug if main is null)
    // This means that at any given time, in either mode,
    // at least one of main or debug must not be null
    
    // NOTE: Just because a channel is (not) included here does not mean Mr.Prog can('t) respond.
    // To ensure Mr.Prog's access (or lack thereof) to a specific channel, 
    // you should change the read/send permissions of that channel for Mr.Prog as desired.
    
    // Channels to use in DebugMode (when you want to test multi-channel commands)
    debugmode: {
      main: null,     // any commands that don't belong in other channels go here (also gets all error responses)
      shop: null,     // buy and sell commands go here
      battle: null,   // battle commands go here
      oc: null,       // if enableOC is true, custom avatars will work only here
      debug: null     // debug messages will show up here for mods/admins
    },
    
    // Channels to use normally
    normalmode: {
      main: null,     // any commands that don't belong in other channels go here (also gets all error responses)
      shop: null,     // buy and sell commands go here
      battle: null,   // battle commands go here
      oc: null,       // if enableOC is true, custom avatars will work only here
      debug: null     // debug messages will show up here for mods/admins
    }
    
  }
  
}

if (Object.freeze) Object.freeze(CONFIG);
module.exports = CONFIG;