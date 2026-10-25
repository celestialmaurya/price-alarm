"use strict";

/**
 * ONE place for every secret and connection detail.
 *
 * Fill these in and the server runs with no Azure app settings at all.
 * An environment variable, when present, always wins - so you can still
 * override any of these in Azure later without touching the code.
 *
 * This file is the only thing you have to edit by hand.
 */
module.exports = {
  // ---------------------------------------------------------------- auth ---
  // shared key the sideloaded app sends as x-api-key.
  // make one up, any long random string, and put the same value in
  // android/gradle.properties as PRICE_ALARM_API_KEY
  API_KEY: "akaar-bakkar",

  // --------------------------------------------------------------- oanda ---
  // Account > Manage API Access in your OANDA portal.
  // The token is all you need: the account id is looked up from it on start.
  OANDA_API_TOKEN: "4790536e43d0f8edd5b25bcfb3ff2f5c-6af78b45d09505193ca99b1043c059d0",
  OANDA_ENVIRONMENT: "practice", // "practice" or "live"
  // Leave empty to auto-detect. Only set this if the token owns several
  // accounts and you want one in particular.
  OANDA_ACCOUNT_ID: "",

  // --------------------------------------------------------------- azure ---
  // Storage account > Security + networking > Access keys > Connection string
  AZURE_STORAGE_CONNECTION_STRING:
    "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net",
  ALARMS_CONTAINER: "alarms",

  // ------------------------------------------------------------ firebase ---
  // Firebase console > Project settings > Service accounts > Generate new
  // private key. Paste the whole JSON object here, or a base64 string of it.
  FIREBASE_SERVICE_ACCOUNT: "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAicHJpY2UtYWxhcm0tYzA0ZjQiLAogICJwcml2YXRlX2tleV9pZCI6ICI3NmNiY2ZmYjhiODBjYWQyMmFlNjkzZTY0MjE1NjhjMjQ0ZGM0N2Y0IiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmdJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLZ3dnZ1NrQWdFQUFvSUJBUURMd0IvajM2YTUvaGE1XG4vWWJoMFlCRkNac2ZadHBJL2FNMWZNQnAyNkowblZ3eXFLM3BPd0FwOHNWczNIZ3hSc3dSUFFtRjl4MzFFcDF3XG4vZ2R2d2pEa3hxNFQrMkcrOTNQTXZMMzZWbk9CY1RjNXRITnh5VUtTOGYzdFF5WlE3Z1ZpckZqUGpUdGZUT0ZSXG5IQjRiSjZCeHFUY0FwYkwzSHpBM2E3L1BDL3Z5SHcybVNCZGJGRXp4a0VkR2drclJvOVNPbm10elBoOTI0RDdSXG5DWGhXd0lZOU5VYXk5TmxKS0twcUxUSnl2a3FTZk9iK08vL0lZZU44MjB6enZtUkd3dUkxRjg0N0swVm5TanQ1XG5yU0p1VjRJdFVqZCtYejZqMGFNVU5uWEdJYW5tekg1RFhWbXlYZUJFUGxiUUp2TXhJdEZZL243eURGaHhwZHcyXG5zcFhsZ3IySEFnTUJBQUVDZ2dFQVA5ZVFabjl5cDM2MU1rdjlVbzZwaVhoTUVkZlJkK041bTAzZW9JekFaNWZUXG5CdENSeGEzR0RGN1VlNXJOVW10amo5YzNQN0hCd2tPMTcyeTVlY3c0TThjSlRwdUs4aUpwTjNMQWVFdFVYKy9RXG5wUlVrd3plVDA2VmRzbFZERVVLemowcC9mWEU4ZEUwTG9MV1Z2VjU2U0lNRUNBRGpoY2xRKzF5WXVsQi8va29xXG5tUVFJUFdvSzcrZXlMWENieVdWcHlKd2JFcHlYYkpYekhBcUw3ZTJXRzd4cE1pd2FIQU5vZnAwVVZEZHcxWGplXG4zVkJmQVp1cVRJcWJMa0xib2FaNHBnQUN0V3o2bTMxbE9NQktYTGVZLzdKZytnYm1Cdjd1ZXVzcEdsa29yMWFwXG5ZOVgybDIwbjJZcTNxMkFVYkxwWVlOS25wM3BVUzRmREc4WFZONnNBR1FLQmdRRC8zeGp6dHFKK3JtT0JLQlVaXG5ZeThMQm9pdlFTUko0RG5EQ0VJRUhocnFMekhRdmRTekxEbjVCUVRkS0ZWeEpPbHFHQkJxWjRpaWIvcDh6aE9UXG5rd0tBUjdJamV2OTNGbDVZejd0T1NDZFN3dllOZ0xJMnAzN2FTQ3ZNSEIrMmlIY3NCcXdhbzd1OHU2Wnh3ODA5XG50R29la0xPUVJsUThVdEh4MnFQUkM3K2Y1UUtCZ1FETDJsTXFEcHNkaWFQbkowZkthNmxFNEFNOUlNT2d2WjJ5XG56Slh2OVVKSjBsRTlnSGoraDhiSUFsYzdvWURvdWJ6ZlhxNWcxUXBzV0ExdktNVmJtUWpTWHBXOTFOdGlUT0hhXG5lK1krOHlOcEcxcmZIOWtqRnRQazZURmUrN2p2RDdQZTV6Rk1EZ3p5MFhQOURyOURnaGp3UnhPcGl0SDdENXIvXG5jait6UGQyWSt3S0JnRlltbGM0cEpoa2xPbGVZV1ZKTTlOL3ZlVUlZMnRFTThDWGN0KzJPL1Z6d093T2ZodWcwXG44ZWdJYXBUVUtjQ0l2eFo3dDdzNzFPTnNkSmhsQW01anh5bk4rZ3E4TlJ1eHFsNll3dVllb1M3YWVlSWQvT011XG5EaVlNdXNKa2pjRDF2YnBUSE10emFaaW9UZWhzRnNTNTVDa2FhM3NlVXVwa3NFK1FZQ3ZZbXRLSkFvR0JBSTJUXG5EQXo2WmRvR3ZIRU9BN3JlT0ltZjlqL2U0RjVqTWdGNk9tdVRicjBzTnNXNjBzMGE2UUFCT0NvdXlRTlg4NGRDXG5EMk1xc2ZsNjBhR3d0QmdnV1ZNWTQzQWFRMTZxdkhScmRnV2tBS1MvbmNXMkxheEQ3MWRjYUxCcHJBOURYWTFpXG5EUWVmL25nbzVTQUx2T09hbDgxUDM2VHd4MUpRalRuNVU2b2RQaWcvQW9HQkFOWE9PZmRlR3lKaE1xS3ZMejJBXG45QlV5aWFmcnQ5RTVNMGFZUnJnQ2ZDc0JsY2R0TTg3N2ozdHdCOThxSUNhb2VOZmsrV0cvWTNJYmJ2Qzc4bXFNXG5tcGdqMFpqWjVEUUtCUzl2c2hKVk1oUFVDY2ZHc01WUXJaeHF2SkNxRSt2dDMxMlRmdVhENEJhUnpURjJxcnQ3XG5LVk0zVklidWZsYU5FbFVtSGdPcmpNNHZcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0BwcmljZS1hbGFybS1jMDRmNC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTc4NTg4MDY3NjkwODEwNDg5NDgiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwcHJpY2UtYWxhcm0tYzA0ZjQuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K",

  // --------------------------------------------------------------- hours ---
  MARKET_TIME_ZONE: "UTC",
  MARKET_OFF_DAYS: "0,6", // 0 = Sunday, 6 = Saturday
};


