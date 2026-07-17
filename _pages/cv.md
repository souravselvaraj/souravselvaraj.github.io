---
layout: cv
permalink: /cv/
title: CV
nav: true
nav_order: 5
cv_pdf: /assets/pdf/Sourav_Selvaraj_CV.pdf # you can also use external links here
cv_format: rendercv # options: rendercv, jsonresume
description: Education, research experience, manuscripts, projects, teaching, and service. A PDF version is available via the download button.
toc:
  sidebar: left
---

<style>
  /* Tidy the rendercv timeline: give every date pill + location one clean left edge */
  .cv .date-column {
    width: 125px !important;
    text-align: left !important;
    transform: none !important;
  }
  /* Flatten the 2-row table so badge and location stack as full-width left-aligned blocks */
  .cv .date-column .table-cv,
  .cv .date-column .table-cv tbody,
  .cv .date-column .table-cv tr,
  .cv .date-column .table-cv td {
    display: block !important;
    width: 100% !important;
    text-align: left !important;
    padding: 0 !important;
    border: 0 !important;
  }
  .cv .date-column .badge {
    display: inline-block;
    min-width: 100px !important;
    margin: 0 !important;
    text-align: center;
    white-space: nowrap;
    letter-spacing: 0.2px;
  }
  .cv .location {
    text-align: left !important;
    white-space: nowrap;
    margin: 0.35rem 0 0 0 !important;
  }
  /* Collapse empty location rows (e.g. Publications, which have no location) */
  .cv .date-column .table-cv tr:last-child td:empty,
  .cv .location:empty {
    display: none !important;
  }
</style>

