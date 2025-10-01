import { ConfigurationService } from "./app/modules/configuration/configuration.service";

const adAccountIds = ["849932146886296", "284160491356662"];
const token = ConfigurationService.getDBConfigs().meta_marketing_access_token;
const batchRequests = adAccountIds.map((id) => ({
  method: "GET",
  relative_url: `act_${id}?fields=account_id,name,spend_cap,amount_spent,account_status`,
}));

fetch(`https://graph.facebook.com/v21.0/`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    access_token: token,
    batch: batchRequests,
  }),
})
  .then((response) => response.json())
  .then((results) => {
    results.forEach((result: any, index: number) => {
      const adAccountData = JSON.parse(result.body);
      console.log(`Ad Account ${adAccountIds[index]}:`, adAccountData);
    });
  })
  .catch((error) => {
    console.error("Batch request error:", error);
  });
