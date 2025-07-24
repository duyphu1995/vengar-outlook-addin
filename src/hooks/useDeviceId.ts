import getBrowserFingerprint from 'get-browser-fingerprint';

let deviceId: string | null = null;

async function initialize() {
  const fingerprint = getBrowserFingerprint();
  if (window.crypto) {
    // Massage the fingerprint into a guid (imperfect, may be collisions, but doesn't matter much for our purposes)
    const msgUint8 = new TextEncoder().encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .slice(0, 128)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const guid = hashHex.replace(
      /(.{8})(.{4})(.{4})(.{4})(.{12})/,
      '$1-$2-$3-$4-$5'
    );
    deviceId = guid;
  } else {
    deviceId = fingerprint;
  }
}

const promise = initialize();

export default function useDeviceId(): string {
  if (deviceId === null) {
    throw promise;
  }

  return deviceId;
}
