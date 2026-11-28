/* Public read / download counters (used by pdf.html and blog.html).
   Elements with data-ck="pdf:<slug>" or "blog:<slug>" get filled with the numbers.
   data-dl="1" also shows downloads. data-mode="short" = compact list style.
   If the counter API fails, the elements stay empty (nothing shows). */
(function(){
  var BN = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];
  function bn(n){ return String(Math.max(0, Math.floor(Number(n) || 0))).replace(/[0-9]/g, function(d){ return BN[+d]; }); }

  function paint(el, c){
    if(!c) return;
    var dl = el.getAttribute("data-dl") === "1";
    var short = el.getAttribute("data-mode") === "short";
    var t = short ? ("👁 " + bn(c.views)) : ("👁 " + bn(c.views) + " বার পড়া হয়েছে");
    if(dl) t += short ? (" · ⬇ " + bn(c.downloads)) : (" · ⬇ " + bn(c.downloads) + " বার ডাউনলোড");
    el.textContent = t;
    el.style.display = "";
  }

  function fill(root, known){
    var els = (root || document).querySelectorAll("[data-ck]");
    var keys = [], i;
    for(i = 0; i < els.length; i++){
      var k = els[i].getAttribute("data-ck");
      if(known && known[k]) paint(els[i], known[k]);
      else if(keys.indexOf(k) < 0) keys.push(k);
    }
    if(!keys.length) return;
    fetch("/api/count?keys=" + encodeURIComponent(keys.join(",")), {cache: "no-store"})
      .then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(data){
        for(var j = 0; j < els.length; j++){
          var kk = els[j].getAttribute("data-ck");
          if(data[kk]) paint(els[j], data[kk]);
        }
      }).catch(function(){});
  }

  function send(key, type){
    var body = JSON.stringify({key: key, type: type});
    return fetch("/api/count", {method: "POST", headers: {"content-type": "application/json"}, body: body, keepalive: true})
      .then(function(r){ if(!r.ok) throw 0; return r.json(); });
  }

  // Count one view for this detail page, then show the numbers.
  function view(key){
    send(key, "view").then(function(c){ var m = {}; m[key] = c; fill(document, m); })
      .catch(function(){ fill(document); });
  }

  // Count a download when any element with data-dlkey is clicked (the link still opens normally).
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest("[data-dlkey]");
    if(!a) return;
    var key = a.getAttribute("data-dlkey");
    try{
      var body = JSON.stringify({key: key, type: "download"});
      if(navigator.sendBeacon) navigator.sendBeacon("/api/count", new Blob([body], {type: "application/json"}));
      else send(key, "download").catch(function(){});
    }catch(err){}
  }, true);

  window.siteCounter = { fill: fill, view: view };
})();
