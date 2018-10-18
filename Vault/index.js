const msRestAzure = require('ms-rest-azure');
const KeyVault = require('azure-keyvault');
const KEY_VAULT_URI = "https://vault.azure.net";

let domain = "4da87cac-8b96-4f03-8de4-007bc2f5ef37"; //tenant id
let clientId = "e4abb4d1-6c49-4931-8de9-e016a7860991"; //application id / service principal
let secretkey = "1X9D4jxBcss38Aj+1k81dULJ0EUejux4o4HN0vg8Gjo="; //key or app secret

var msi_endpoint = process.env['MSI_ENDPOINT'];
var msi_secret = process.env['MSI_SECRET'];

async function getKeyVaultCredentials(context){
    
    if (process.env.APPSETTING_WEBSITE_SITE_NAME)
    {
        //note: to get this to work you have to enable MSI in the portal, see instructions
        //at https://docs.microsoft.com/en-us/azure/app-service/app-service-managed-service-identity
        context.log('Using loginWithAppServiceMSI');
        return msRestAzure.loginWithAppServiceMSI({resource: 'https://vault.azure.net'});
    }
    else
    {
        //note: to get this to work you need an AD app. see link in comment below
        context.log('Using loginWithServicePrincipalSecret');
        return msRestAzure.loginWithServicePrincipalSecret(clientId, secretkey, domain);
    }
}

/*
// Get  a secret value from the azure key vault using the specified name as secret name
// For further info see:
// https://azure.microsoft.com/en-us/resources/samples/app-service-msi-keyvault-node/
// https://rahulpnath.com/blog/azure-key-vault-from-node-dot-js/
*/
function getKeyVaultSecret(context, credentials, name) 
{
//note: to get this to work you hav to follow steps here https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-create-service-principal-portal
//to setup an AD app and set the right permissions. 

  let secretName = "QBSecret" + name;
  let keyVaultClient = new KeyVault.KeyVaultClient(credentials);
  var vaultUri = "https://" + "esd-integration" + ".vault.azure.net";

  return keyVaultClient.getSecret(vaultUri, secretName, "");
}

/*
// generate a new secret in the azure key 
// For further info see:
// https://www.red-gate.com/simple-talk/cloud/platform-as-a-service/using-azure-keyvault-with-node-js/
// https://www.visualstudiogeeks.com/devops/working-with-azure-keyvault-using-node
*/
async function generateKeyVaultSecret(context, credentials, name) 
{
      let keyVaultClient = new KeyVault.KeyVaultClient(credentials);
      var vaultUri = "https://" + "esd-integration" + ".vault.azure.net";
    
      let secretName = "QBSecret" + name;
      let secretValue = "1238M*3H@*rN>$TYS?";
 
      return await keyVaultClient.setSecret(vaultUri, secretName, secretValue, 
        { tags: { "build": "20181018.1" }, contentType: "Added via nodejs application" });
}    

module.exports = async function (context, req) {
    context.log('v1.8: Vault test running');

    let response;
    let mysecret;

    try {
        response = await getKeyVaultCredentials(context)
    } catch (err) 
    {
        context.log('Http error in getKeyVaultCredentials: ' +  err)
    }

    try {
         await generateKeyVaultSecret(context, response, req.query.name)
    } 
    catch (err) {
          context.log('Http error in generateKeyVaultSecret: ' +  err)
    }

    try {
        mysecret = await getKeyVaultSecret(context, response, req.query.name)
        context.log("Secret: " + mysecret.value + " Name: " + req.query.name);
      } catch (err) {
          context.log('Http error in getKeyVaultSecret: ' +  err)
    }
   
    var secret = "UNDEFINED";
    if(mysecret)
        secret = mysecret.value;

    if (req.query.name || (req.body && req.body.name)) {
        context.res = {
            body: "Hello: " + (req.query.name || req.body.name) + ", " +
            "msi_endpoint: " + msi_endpoint + ", Process: " + process.env.APPSETTING_WEBSITE_SITE_NAME
            + ", Secret: " + secret
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
};