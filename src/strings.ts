import LocalizedStrings from 'react-localization';

export default new LocalizedStrings({
  en: {
    appName: 'EB Control',

    availableInNextVersion: "This feature will be available in the next version",
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    
    buttonEdit: 'Edit',
    buttonConfigure: 'Configure',
    buttonDecrytValt: 'Decrypt Vault',
    buttonReview: 'Review',
    btnRevoke: 'Revoke',
    btnShred: 'Shred',
    btnConfirmAndSend: 'Confirm & Send',

    componentErrorModalConfirm: 'Okay',
    componentErrorModalTitle: 'Error',
    componentShredDesc: 'Your input is invalid. Please check your input and try again.',

    componentHeaderLogout: 'Logout',
    componentHeaderAccounts: 'Accounts',

    pageAccountsAddButton: 'Add Account',
    pageAccountsConfirmSignOut: 'Yes, sign out',
    pageAccountsConfirmSignOutTemplate:
      'Are you sure you want to sign out the account <%= email %>?',
    pageAccountsColumnActions: 'Actions',
    pageAccountsColumnDelete: 'Delete',
    pageAccountsColumnAutomaticLogin: 'Automatic Login',
    pageAccountsColumnEmail: 'Email',
    pageAccountsColumnStatus: 'Status',
    pageAccountsColumnType: 'Type',
    pageAccountsFreeLabel: 'Standard',
    pageAccountsSignOut: 'Sign Out',
    pageAccountsSignIn: 'Sign In',
    pageAccountsEBControlAccounts: 'EB Control Accounts',
    pageAccountsLogIntoEB: 'Log into EB Control using your Outlook Accounts',
    pageAccountsConfirmRemoveTemplate:
      'Are you sure you want to remove the account <%= email %>?',
    pageAccountsConfirmRemove: 'Yes, remove account',
    pageIndexCheckEmailPlaceholder: 'Email',
    pageIndexCheckEmailSubmit: 'Check if Account Exists',
    pageIndexCheckEmailText:
      'To get started enter your email address to check whether you have an existing account.',
    pageIndexCheckEmailTitle: 'Login',

    pageIndexLoginForgot: 'Forgot Password',
    pageIndexLoginPasswordPlaceholder: 'Password',
    pageIndexLoginSubmit: 'Login',
    pageIndexLoginText:
      "Great, you've already registered your account. Enter your password to login.",
    pageIndexLoginTitle: 'Login',

    pageIndexLoading: 'Creating Secure Environment',
    pageIndexRegisterConfirmPasswordPlaceholder: 'Confirm Password',
    pageIndexRegisterEmailPlaceholder: 'Email',
    pageIndexRegisterPasswordLength: '8 characters',
    pageIndexRegisterPasswordLowerCase: '1 Lowercase',
    pageIndexRegisterPasswordNumber: '1 Number',
    pageIndexRegisterPasswordPlaceholder: 'Password',
    pageIndexRegisterPasswordSpecial: '1 Special Character',
    pageIndexRegisterPasswordUpperCase: '1 Uppercase',
    pageIndexRegisterSubmit: 'Register',
    pageIndexRegisterText: '',
    pageIndexRegisterTitle: 'Register',

    pageOpenContainerAttachments: 'Attachments',
    pageOpenContainerFrom: 'From',
    pageOpenContainerReply: 'Reply',
    pageOpenContainerReplyAll: 'Reply All',
    pageOpenContainerSubject: 'Subject',
    pageOpenContainerTitle: 'Decrypted Vault',
    pageOpenContainerTo: 'To',
    pageOpenContainerCC: 'CC',
    pageOpenContainerBCC: 'BCC',

    pageOpenNoAuthorizedUsers: 'No authorized user found to open vault.',
    pageOpenQRCodeTitle: 'Location Access Protection Enabled!',
    pageOpenQRCodeDescription:
      'You MUST scan the QR Code below using the EB Control app on your mobile device using this icon to verify your location before this protected file will be decrypted.',
    pageOpenQRCodeCounter: 'QR Code Expiration Countdown',
    pageOpenQRCodeError: 'This file can NOT be decrypted because your current location is NOT within the parameters defined by the data owner.',
    pageSecureErrorTitle: 'Location Verification Failed!',
    pageSecureTabReceiptSubTitle: 'Receive access notifications',
    pageSecureTabReceiptTitle: 'Read Receipt',

    pageSecureHowDescription:
      'Select how you would like authorized accessors to use the data you are sharing with them. ',
    pageSecureHowTitle: 'Data Usage',
    pageSecureHowForwardDescription: 'Prevent accessor from forwarding',
    pageSecureHowForwardLabel: 'Prevent Forward',
    pageSecureHowCopyDescription: 'Prevent accessor from copying',
    pageSecureHowCopyLabel: 'Prevent Copy',
    pageSecureHowPrintDescription: 'Prevent accessor from printing',
    pageSecureHowPrintLabel: 'Prevent Print',
    pageSecureHowReadOnlyDescription:
      'If turned on, all options below are enabled',
    pageSecureHowReadOnlyLabel: 'Read Only',
    pageSecureHowSaveDescription: 'Prevent accessor from saving',
    pageSecureHowSaveLabel: 'Prevent Save',

    pageSecureNotesDescription:
      'Enter any notes or instructions that you would like to add to your vault.',
    pageSecureNotesTitle: 'Notes',

    pageSecureTabHowSubTitle: 'Configure Data Usage Rights',
    pageSecureTabHowSubTitle1: 'Set data usage rights',
    pageSecureTabHowTitle: 'How',
    pageSecureTabWhatTitle: 'What',
    pageSecureTabWhenSubTitle: 'Set access by date and time',
    pageSecureTabWhenTitle: 'When',
    pageSecureTabWhereSubTitle: 'Set access by location',
    pageSecureTabWhereTitle: 'Where',

    pageSecureWhenDefaultSunrise: 'Starts now',
    pageSecureWhenDefaultSunset: 'Never ends',
    pageSecureWhenDescription:
      'Select the time period that you would like your data to be accessed.',
    pageSecureWhenDateLabel: 'Date',
    pageSecureWhenTimeLabel: 'Time',
    pageSecureWhenSelectSunrise: 'Starts on specific day and time',
    pageSecureWhenSelectSunset: 'Ends on specific day and time',
    pageSecureWhenSunriseTitle: 'Start Time',
    pageSecureWhenSunsetTitle: 'End Time',
    pageSecureWhenTitle: 'Configure Access Timelines',

    pageSecureWhereTitle: 'Configure Location Access',
    pageSecureWhereDescription:
      'Select the locations you would like your data to be viewed in.',
    pageSecureWhereFilterAll: 'All',
    pageSecureWhereFilterIncluded: 'Included',
    pageSecureWhereFilterExcluded: 'Excluded',
    pageSecureWhereFilterLabel: 'Filter View:',
    pageSecureWhereSearchPlaceholder: 'Search Country...',
    pageSecureWhereToggleAllLabel: 'Include/Exclude All Countries',

    closeDialog: 'closeDialog',
    closeDialogEndTime: 'closeDialogEndTime',
    refreshTokenRestUrl: "refreshTokenRestUrl", 
    attachmentName: 'attachmentName',
    revokeContent1: 'The REVOKE button removes access to your vault for ALL authorized accessors.',
    revokeContent2: 'Are you sure you want to REVOKE access for ALL authorized accessors?',
    revokeSuccessful: 'Revoke successful',
    shredContent1: 'The SHRED button permanently prevents the vault from ever being decrypted by anyone, including you, the data author. This action is NOT reversible.',
    shredContent2: 'Please type SHRED in the input box below and click on the ‘Yes, Shred’ button to destroy access to this vault.',
    shredSuccessful: 'Shred successful',
    disabledByAuthor: 'Disabled by Author',
    forwardSecureMessage: 'Click to Forward Secure Message',
    addAttachment: 'Click to Add Attachment',
    copySecureMessage: 'Click to Copy Secure Message to Clipboard',
    saveSecureMessage: 'Click to Save Secure Message',
    printSecureMessage: 'Click to Print Secure Message',
    shredSecureMessage: 'Click to Shred this Secure Message',
    revokeSecureMessage: 'Click to Revoke this Secure Message',
    disableShredMessage: 'Disabled. Only the author can shred a Secure File',
    disableRevokeMessage: 'Disabled. Only the author can revoke a Secure File',
    tokenForRestUrl: "tokenForRestUrl",
    itemID: "itemID",
    removeAttachment: "Remove attachment item",
    canNotSendNowPleaseTryAgain: "Cannot send now. Please try again.",
    serverErrorOccurred: "A server error occurred. Please reload the page.",
    secureVaultNotification: "Secure Vault Notification",
    isEncrypted: 'isEncrypted',

    setSunsetAfterSunrise: "The sunset must be set to a time after sunrise",
    sunriseInPast: "Sunrise cannot be in the past",
    sunsetInPast: "Sunset cannot be in the past",
    
    notAllowCopy: "Accessors are NOT allowed to copy data.",
    allowCopy: "Accessors are allowed to copy data.",
    notAllowPrint: "Accessors are NOT allowed to print data.",
    allowPrint: "Accessors are allowed to print data.",
    notAllowSave: "Accessors are NOT allowed to save data.",
    allowSave: "Accessors are allowed to save data.",
    notAllowForward: "Accessors are NOT allowed to forward data.",
    allowForward: "Accessors are allowed to forward data.",
    notAllowTimeline: "Accessors are NOT allowed view data at this date and time.",
    allowTimeline: "Accessors are allowed view data at this date and time.",
    notAllowLocation: "Accessors are NOT allowed to view data in this location.",
    allowLocation: "Accessors are allowed to view data in this location.",

    information: "Information",
    ebControlProtection: "EB Control Protection",

    mailSentSuccessfully: "Mail has been send successfully.",
    modalFileSecured: "Files secured!",
    modalSending: "Sending the mail...",
    modalPleaseWaitSecure: "Please wait while we secure your files...",
    modalEveryWhere: "Everywhere",
    modalEveryWhereElse: "Everywhere else",

    errorInputEmptyField: "Empty Field.",
    errorInputInvalidAndEmptyField: "Invalid email format or empty field.",
    errorInputInvalidEmail: "Invalid email format.",

    headerTooltipForward: "Forward",
    headerTooltipPrint: "Print",
    headerTooltipSave: "Save",
    headerTooltipCopy: "Copy",
    headerTooltipTimeline: "Timeline",
    headerTooltipLocation: "Location",

    localAuth: "auth",
    largeSizeAttachment: "Total size of Attachment is too large.",

    errorTheEmailHasNoAttachment: "This email hasn't attachment or vgar file",
    errorLimitAttachmentsInEmailBody: "According to Microsoft, the limit for attachments in the email body used for add-ins is less than 1 MB. So we can't replace the origin content of this email.",
    errorNotProtectedByEBIProduct: "This email hasn't protected by any EB Control product.",
    descriptionClosePopup : "The vault you were viewing has been closed because the Access Times are outside the range defined by the data owner.",

    LS_MAIL_ITEM: "mail_item",
    LS_DEVICE_PLATFORM: "device_platform",
    LS_MSG_CALLBACKFUNC: "msg_callbackfunc",
    LS_MSG_JSON_DATA: "msg_json_data",
    LS_MSG_ITEMID: "msg_itemid",
    LS_SentDateTime_Origin: "sentDateTimeOrigin",
    LS_Subject_Origin: "subjectOrigin",

    DATETIME_FORMAT: "MM/DD/YYYY hh:mm A",
  }
});
