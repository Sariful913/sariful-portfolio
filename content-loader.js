(function(){
  "use strict";
  /* Loads the admin-editable content (blog posts + resources) and updates
     the static cards in place. If the JSON files cannot be loaded, the
     page keeps its built-in content, so nothing ever breaks. */

  function esc(s){ return String(s == null ? "" : s); }

  function paragraphs(body){
    return esc(body).split(/\n\s*\n/).filter(function(p){ return p.trim(); })
      .map(function(p){ return "<p>" + esc(p).trim().replace(/\n/g, "<br>") + "</p>"; }).join("");
  }

  /* ---------- Blog reader (own copy, uses the modal already on the page) ---------- */
  function openPostModal(post){
    var modal = document.getElementById("postModal");
    if(!modal) return;
    var img = document.getElementById("modalImg");
    if(img){ img.src = post.image || ""; img.alt = post.title || ""; }
    var d = document.getElementById("modalDate");
    if(d) d.textContent = post.category || "";
    var t = document.getElementById("modalTitle");
    if(t) t.textContent = post.title || "";
    var b = document.getElementById("modalBody");
    if(b) b.innerHTML = paragraphs(post.body || "");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    var box = modal.querySelector(".modal-box");
    if(box) box.scrollTop = 0;
  }

  function buildBlog(posts){
    var grid = document.querySelector("#blog .grid-3");
    if(!grid) return;
    var cards = grid.querySelectorAll(".blog-card");
    posts.forEach(function(post, i){
      var card = cards[i];
      if(!card){
        card = cards[cards.length - 1].cloneNode(true);
        card.classList.remove("reveal"); /* clones are not observed by the reveal script */
        grid.appendChild(card);
      }
      var img = card.querySelector(".blog-media img");
      if(img){ img.src = post.image || ""; img.alt = post.title || ""; }
      var cat = card.querySelector(".blog-date");
      if(cat) cat.textContent = post.category || "";
      var h = card.querySelector("h3");
      if(h) h.textContent = post.title || "";
      var ex = card.querySelector(".blog-body p.bn");
      if(ex) ex.textContent = post.excerpt || "";
      var btn = card.querySelector("[data-open-post]");
      if(btn){
        var fresh = btn.cloneNode(true); /* drops the old built-in listener */
        btn.parentNode.replaceChild(fresh, btn);
        fresh.setAttribute("data-open-post", post.id || ("post" + (i + 1)));
        fresh.addEventListener("click", function(){ openPostModal(post); });
      }
    });
    while(grid.querySelectorAll(".blog-card").length > posts.length){
      var all = grid.querySelectorAll(".blog-card");
      all[all.length - 1].remove();
    }
  }

  /* ---------- Resources ---------- */
  function waLink(title, price){
    return "https://wa.me/8801609494024?text=" +
      encodeURIComponent("Hi Sariful, I want to buy the " + title + " (" + price + ").");
  }

  function slugify(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function fileSlug(it){ var f = String(it.pdf_file || "").split("?")[0].split("/").pop().replace(/\.pdf$/i, ""); return slugify(f); }
  function slugOf(it, i){ return slugify(it.slug) || fileSlug(it) || slugify(it.title) || ("pdf-" + (i + 1)); }
  /* unique link per item - if two items would get the same link, the later one gets -2, -3 ... */
  function slugList(items){ var used = {}; return items.map(function(it, i){ var s = slugOf(it, i), b = s, n = 2; while(used[s]){ s = b + "-" + n; n++; } used[s] = 1; return s; }); }

  function buildResources(items){
    var grid = document.querySelector("#resources .grid-2");
    if(!grid) return;
    var cards = grid.querySelectorAll(".res-card");
    var slugs = slugList(items);
    var freeTpl = null, paidTpl = null;
    cards.forEach(function(c){
      var a = c.querySelector("a.btn");
      if(a && a.classList.contains("btn-wa")) paidTpl = c;
      else if(a) freeTpl = c;
    });
    items.forEach(function(it){
      var idx = items.indexOf(it);
      var card = cards[idx];
      if(!card){
        var tpl = it.kind === "paid" ? (paidTpl || freeTpl) : (freeTpl || paidTpl);
        if(!tpl) return;
        card = tpl.cloneNode(true);
        card.classList.remove("reveal");
        grid.appendChild(card);
      }
      var h = card.querySelector("h3");
      if(h) h.textContent = it.title || "";
      var d = card.querySelector("p.bn");
      if(d){
        d.textContent = it.description || "";
        /* keep cards tidy - the full text is on the resource page */
        d.style.display = "-webkit-box"; d.style.webkitBoxOrient = "vertical";
        d.style.webkitLineClamp = "4"; d.style.overflow = "hidden";
      }
      /* the whole card opens the resource's own page */
      var page = "/pdf/" + slugs[idx];
      card.setAttribute("data-page", page);
      card.setAttribute("role", "link");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", (it.title || "Resource") + " - details");
      card.style.cursor = "pointer";
      /* visible link so people can see the card opens a page */
      var more = card.querySelector("a.res-more");
      if(!more){
        more = document.createElement("a");
        more.className = "res-more";
        more.style.cssText = "display:inline-block;margin:6px 0 14px;color:#22D3EE;font-weight:600;font-size:.92rem;text-decoration:none";
        var meta = card.querySelector(".res-meta");
        if(meta && meta.parentNode) meta.parentNode.insertBefore(more, meta.nextSibling);
        else card.appendChild(more);
      }
      more.href = page;
      more.textContent = "বিস্তারিত পড়ুন \u2192";
      if(h && !h.querySelector("a")){
        var ha = document.createElement("a");
        ha.href = page; ha.textContent = h.textContent;
        ha.style.cssText = "color:inherit;text-decoration:none";
        h.textContent = ""; h.appendChild(ha);
      }
      if(!card._pageBound){
        card._pageBound = true;
        card.addEventListener("click", function(e){
          if(e.target.closest && e.target.closest("a")) return; /* buttons keep their own link */
          location.href = card.getAttribute("data-page");
        });
        card.addEventListener("keydown", function(e){
          if(e.key === "Enter" && e.target === card) location.href = card.getAttribute("data-page");
        });
      }
      var meta = card.querySelectorAll(".res-meta span");
      if(meta.length >= 5 && it.tag) meta[4].textContent = it.tag;
      var a = card.querySelector("a.btn");
      if(a){
        a.classList.remove("btn-wa", "btn-primary");
        if(it.kind === "paid"){
          a.classList.add("btn-wa");
          a.href = waLink(it.title || "", it.price || "");
          a.textContent = "Buy via WhatsApp - " + (it.price || "");
        }else{
          a.classList.add("btn-primary");
          a.href = page;
          a.removeAttribute("target");
          a.textContent = "Read & Download Free PDF";
        }
      }
    });
    while(grid.querySelectorAll(".res-card").length > items.length){
      var all = grid.querySelectorAll(".res-card");
      all[all.length - 1].remove();
    }
  }

  function loadJSON(url){
    return fetch(url, {cache: "no-store"}).then(function(r){
      if(!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  loadJSON("content/blog-posts.json").then(function(data){
    var posts = Array.isArray(data) ? data : (data.posts || []);
    if(posts.length) buildBlog(posts);
  }).catch(function(){ /* keep built-in blog content */ });

  loadJSON("content/resources.json").then(function(data){
    var items = Array.isArray(data) ? data : (data.resources || []);
    if(items.length) buildResources(items);
  }).catch(function(){ /* keep built-in resources */ });
})();
