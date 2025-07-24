var item;

Office.onReady(async (info) => {
  item = Office.context.mailbox.item;
});

async function sendEmail(event) {
  item.body.getAsync("html", { asyncContext: event }, async function (asyncResult) {
    if (JSON.parse(localStorage.getItem("isEncryptEnable"))) {
      item.getAttachmentsAsync({ asyncContext: { currentItem: item } }, async (result) => {
        if (result.value.length === 1) {
          result.value.forEach(async ({ id, name }) => {
            const isEncrypted = localStorage.getItem("isEncrypted") ? localStorage.getItem("isEncrypted") : false;
            if (name.includes(".vgar") && isEncrypted) {
              item.body.setAsync(
                modifyEmail(asyncResult.value),
                { coercionType: "html", asyncContext: "This is passed to the callback" },
                function callback(result) {
                  console.log(modifyEmail(asyncResult.value));
                  asyncResult.asyncContext.completed({ allowEvent: true });
                }
              );
              localStorage.removeItem("isEncrypted");
            } else {
              asyncResult.asyncContext.completed({ allowEvent: false });
              Office.context.mailbox.item.notificationMessages.replaceAsync(
                "action",
                "Can't send the email without sercure file"
              );
            }
          });
        } else {
          asyncResult.asyncContext.completed({ allowEvent: false });
          Office.context.mailbox.item.notificationMessages.replaceAsync(
            "action",
            "Can't send the email without sercure file"
          );
        }
      });
    } else {
      Office.context.mailbox.item.notificationMessages.replaceAsync("action", "Sending the email ...");
      item.body.setAsync(
        asyncResult.value,
        { coercionType: "html", asyncContext: "This is passed to the callback" },
        function callback(result) {
          asyncResult.asyncContext.completed({ allowEvent: true });
        }
      );
    }
  });
}

function modifyEmail(htmlBody) {
  return `<!DOCTYPE html>
            <html>
                <head>
                    <title>EB Control</title>
                    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <meta content="width=device-width, initial-scale=1.0" name="viewport">
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
                </head> 
                ${htmlBody} 
            </html>`;
}
