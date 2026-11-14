// Ask: grounded chat. This build has no chat server set, so it is shown in its offline state.
export default {
  scenes: [
    { name: "tab", query: "t=1977-10-17&pov=45,-35,2.3", minDur: 6,
      setup: async (c) => { await c.ev(() => { location.hash = "#/ask"; }); },
      lines: [
        { say: "Ask is a chat that answers only from the atlas.", cap: "Ask is a chat that answers only from the atlas." },
        { say: "It finds the matching entries first, and sends only those with your question.", cap: "It finds the matching entries first, and sends only those with your question." },
      ] },
    { name: "offline", query: "t=1977-10-17&pov=45,-35,2.3", minDur: 9,
      setup: async (c) => { await c.ev(() => { location.hash = "#/ask"; }); },
      frame: async (c, f, s) => {
        if (c.at(s, c.L[0].start + 0.4)) await c.type("#chatQ", "When did Concorde fly London to New York?");
        if (c.at(s, c.L[0].end - 0.3)) await c.ev(() => document.getElementById("chatForm").requestSubmit());
      },
      lines: [
        { say: "No chat server is set up in this copy, so Ask is offline. It still lists the entries that match, with links to them.", cap: "No chat server is set up in this copy, so Ask is offline. It still lists the entries that match, with links to them." },
        { say: "When a server is set up, each answer cites the entries it used. Anything it cannot find is marked unknown. A citation that was not sent is flagged.", cap: "When a server is set up, each answer cites the entries it used. Anything it cannot find is marked [UNKNOWN]. A citation that was not sent is flagged." },
      ] },
  ],
};
