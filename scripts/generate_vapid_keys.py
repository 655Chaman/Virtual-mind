#!/usr/bin/env python3
"""
Generate VAPID Key Pair for Web Push Notifications.
Run this ONCE to generate your keys, then add them to your .env file.

Usage:
    python scripts/generate_vapid_keys.py
"""

def generate_vapid_keys():
    try:
        from py_vapid import Vapid
    except ImportError:
        print("[ERROR] py_vapid not installed.")
        print("Run: pip install py-vapid pywebpush")
        return

    vapid = Vapid()
    vapid.generate_keys()

    private_key = vapid.private_pem().decode('utf-8').strip()
    # Get the URL-safe base64 encoded public key for the browser
    public_key = vapid.public_key.public_bytes(
        encoding=__import__('cryptography').hazmat.primitives.serialization.Encoding.X962,
        format=__import__('cryptography').hazmat.primitives.serialization.PublicFormat.UncompressedPoint
    )

    import base64
    public_key_b64 = base64.urlsafe_b64encode(public_key).rstrip(b'=').decode('utf-8')

    print("\n" + "="*60)
    print("✅ VAPID KEY PAIR GENERATED")
    print("="*60)
    print("\nAdd the following to your .env file:\n")
    print(f'VAPID_PUBLIC_KEY="{public_key_b64}"')
    print(f'VAPID_PRIVATE_KEY="{private_key}"')
    print(f'VAPID_CLAIMS_EMAIL="operator@virtual-mind.local"')
    print("\n" + "="*60)
    print("⚠️  Keep the PRIVATE KEY secret. Share only the PUBLIC KEY.")
    print("="*60 + "\n")

    return public_key_b64, private_key


if __name__ == "__main__":
    generate_vapid_keys()
