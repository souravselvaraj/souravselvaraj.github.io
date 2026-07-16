---
layout: page
permalink: /repositories/
title: repositories
description: Public GitHub repositories and project code.
nav: true
nav_order: 4
---

Public repositories from [@souravselvaraj](https://github.com/souravselvaraj).

<div class="row row-cols-1 row-cols-md-2">
{% for repo in site.data.repositories.repo_cards %}
  <div class="col mb-4">
    <a href="{{ repo.url }}" target="_blank" rel="external nofollow noopener" class="text-decoration-none">
      <div class="card hoverable h-100">
        <div class="card-body">
          <h3 class="card-title">{{ repo.name }}</h3>
          {% if repo.description %}
            <p class="card-text">{{ repo.description }}</p>
          {% else %}
            <p class="card-text text-muted">No repository description provided.</p>
          {% endif %}
          <p class="post-meta mb-0">
            {% if repo.language %}{{ repo.language }}{% else %}Code{% endif %}
            &nbsp; &middot; &nbsp; updated {{ repo.updated_at | date: "%b %-d, %Y" }}
            {% if repo.stars > 0 %}
              &nbsp; &middot; &nbsp; {{ repo.stars }} star{% if repo.stars != 1 %}s{% endif %}
            {% endif %}
            {% if repo.fork %}
              &nbsp; &middot; &nbsp; fork
            {% endif %}
          </p>
        </div>
      </div>
    </a>
  </div>
{% endfor %}
</div>
