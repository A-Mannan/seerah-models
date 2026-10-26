#!/usr/bin/env python3
"""Build the four self-hosted WOFF2 faces used by the atlas.

Sources live outside the repo (downloaded OFL releases). The output is checked:
Latin faces must cover the transliteration set, Amiri must carry the honorific
U+FDFA, and the Urdu face must carry the Urdu alphabet. Re-run after changing
copy; a missing glyph is a build failure, not a fallback surprise.
"""
from __future__ import annotations

import pathlib
import subprocess
import sys

from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "landing" / "fonts"
TMP = pathlib.Path("/tmp/atlas-fonts")
SRC_CORMORANT = pathlib.Path("/tmp/fonts/cormorant.ttf")
SRC_ARCHIVO = pathlib.Path("/tmp/fonts/archivo.ttf")
SRC_AMIRI = pathlib.Path("/tmp/fonts/Amiri-1.001/Amiri-Regular.ttf")
SRC_NASTALIQ = pathlib.Path("/usr/share/fonts/truetype/noto/NotoNastaliqUrdu-Regular.ttf")

LATIN = (
    "\u0020\u0021\u0022\u0023\u0024\u0025\u0026\u0027\u0028\u0029\u002a\u002b\u002c\u002d\u002e\u002f"
    "\u0030\u0031\u0032\u0033\u0034\u0035\u0036\u0037\u0038\u0039\u003a\u003b\u003c\u003d\u003e\u003f"
    "\u0040\u0041\u0042\u0043\u0044\u0045\u0046\u0047\u0048\u0049\u004a\u004b\u004c\u004d\u004e\u004f"
    "\u0050\u0051\u0052\u0053\u0054\u0055\u0056\u0057\u0058\u0059\u005a\u005b\u005c\u005d\u005e\u005f"
    "\u0060\u0061\u0062\u0063\u0064\u0065\u0066\u0067\u0068\u0069\u006a\u006b\u006c\u006d\u006e\u006f"
    "\u0070\u0071\u0072\u0073\u0074\u0075\u0076\u0077\u0078\u0079\u007a\u007b\u007c\u007d\u007e"
    "\u00a0\u00a3\u00a7\u00a9\u00ab\u00ad\u00ae\u00b7\u00bb\u00bf"
    "\u00c0\u00c1\u00c2\u00c3\u00c4\u00c5\u00c6\u00c7\u00c8\u00c9\u00ca\u00cb\u00cc\u00cd\u00ce\u00cf"
    "\u00d0\u00d1\u00d2\u00d3\u00d4\u00d5\u00d6\u00d7\u00d8\u00d9\u00da\u00db\u00dc\u00dd\u00de\u00df"
    "\u00e0\u00e1\u00e2\u00e3\u00e4\u00e5\u00e6\u00e7\u00e8\u00e9\u00ea\u00eb\u00ec\u00ed\u00ee\u00ef"
    "\u00f0\u00f1\u00f2\u00f3\u00f4\u00f5\u00f6\u00f7\u00f8\u00f9\u00fa\u00fb\u00fc\u00fd\u00fe\u00ff"
    "\u0100\u0101\u0102\u0103\u0104\u0105\u0106\u0107\u0108\u0109\u010a\u010b\u010c\u010d\u010e\u010f"
    "\u0110\u0111\u0112\u0113\u0114\u0115\u0116\u0117\u0118\u0119\u011a\u011b\u011c\u011d\u011e\u011f"
    "\u0120\u0121\u0122\u0123\u0124\u0125\u0126\u0127\u0128\u0129\u012a\u012b\u012c\u012d\u012e\u012f"
    "\u0130\u0131\u0132\u0133\u0134\u0135\u0136\u0137\u0138\u0139\u013a\u013b\u013c\u013d\u013e\u013f"
    "\u0140\u0141\u0142\u0143\u0144\u0145\u0146\u0147\u0148\u0149\u014a\u014b\u014c\u014d\u014e\u014f"
    "\u0150\u0151\u0152\u0153\u0154\u0155\u0156\u0157\u0158\u0159\u015a\u015b\u015c\u015d\u015e\u015f"
    "\u0160\u0161\u0162\u0163\u0164\u0165\u0166\u0167\u0168\u0169\u016a\u016b\u016c\u016d\u016e\u016f"
    "\u0170\u0171\u0172\u0173\u0174\u0175\u0176\u0177\u0178\u0179\u017a\u017b\u017c\u017d\u017e\u017f"
    "\u0180\u0181\u0182\u0183\u0184\u0185\u0186\u0187\u0188\u0189\u018a\u018b\u018c\u018d\u018e\u018f"
    "\u0190\u0191\u0192\u0193\u0194\u0195\u0196\u0197\u0198\u0199\u019a\u019b\u019c\u019d\u019e\u019f"
    "\u01a0\u01a1\u01a2\u01a3\u01a4\u01a5\u01a6\u01a7\u01a8\u01a9\u01aa\u01ab\u01ac\u01ad\u01ae\u01af"
    "\u01b0\u01b1\u01b2\u01b3\u01b4\u01b5\u01b6\u01b7\u01b8\u01b9\u01ba\u01bb\u01bc\u01bd\u01be\u01bf"
    "\u1e00\u1e01\u1e02\u1e03\u1e04\u1e05\u1e06\u1e07\u1e08\u1e09\u1e0a\u1e0b\u1e0c\u1e0d\u1e0e\u1e0f"
    "\u1e10\u1e11\u1e12\u1e13\u1e14\u1e15\u1e16\u1e17\u1e18\u1e19\u1e1a\u1e1b\u1e1c\u1e1d\u1e1e\u1e1f"
    "\u1e20\u1e21\u1e22\u1e23\u1e24\u1e25\u1e26\u1e27\u1e28\u1e29\u1e2a\u1e2b\u1e2c\u1e2d\u1e2e\u1e2f"
    "\u1e30\u1e31\u1e32\u1e33\u1e34\u1e35\u1e36\u1e37\u1e38\u1e39\u1e3a\u1e3b\u1e3c\u1e3d\u1e3e\u1e3f"
    "\u1e40\u1e41\u1e42\u1e43\u1e44\u1e45\u1e46\u1e47\u1e48\u1e49\u1e4a\u1e4b\u1e4c\u1e4d\u1e4e\u1e4f"
    "\u1e50\u1e51\u1e52\u1e53\u1e54\u1e55\u1e56\u1e57\u1e58\u1e59\u1e5a\u1e5b\u1e5c\u1e5d\u1e5e\u1e5f"
    "\u1e60\u1e61\u1e62\u1e63\u1e64\u1e65\u1e66\u1e67\u1e68\u1e69\u1e6a\u1e6b\u1e6c\u1e6d\u1e6e\u1e6f"
    "\u1e70\u1e71\u1e72\u1e73\u1e74\u1e75\u1e76\u1e77\u1e78\u1e79\u1e7a\u1e7b\u1e7c\u1e7d\u1e7e\u1e7f"
    "\u1e80\u1e81\u1e82\u1e83\u1e84\u1e85\u1e86\u1e87\u1e88\u1e89\u1e8a\u1e8b\u1e8c\u1e8d\u1e8e\u1e8f"
    "\u1e90\u1e91\u1e92\u1e93\u1e94\u1e95\u1e96\u1e97\u1e98\u1e99\u1e9a\u1e9b"
    "\u2010\u2011\u2012\u2013\u2014\u2015\u2018\u2019\u201a\u201b\u201c\u201d\u201e\u201f"
    "\u2020\u2021\u2022\u2026\u2027\u2030\u2031\u2039\u203a\u2044"
    "\u02bb\u02bc\u02bd\u02be\u02bf\u02c6\u02c7\u02d8\u02d9\u02da\u02db\u02dc\u02dd"
    "\u2190\u2192\u2197\u2198\u2199\u25b2\u25bc\u2713"
)

# Every Arabic/Urdu character in the shipped pages and ledgers, plus the
# Arabic blocks that shaping can output and the Urdu alphabet as a safety net.
URDU = (
    " \u00a0اآأءؤئبپتٹثجچحخدڈذرڑزژسشصضطظعغفقکگلمنںوہھیے"
    "ًٌٍَُِّْٰٖٜٟٗ٘ٙٚٛٝٞ"
    "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩"
    "،؛؟۔٪ﷺﷻ"
)
ARABIC = URDU + (
    "\u0600\u0601\u0602\u0603\u0604\u0605\u0606\u0607\u0608\u0609\u060a\u060b\u060c\u060d\u060e\u060f"
    "\u0610\u0611\u0612\u0613\u0614\u0615\u0616\u0617\u0618\u0619\u061a\u061b\u061c\u061d\u061e\u061f"
    "\u0620\u0621\u0622\u0623\u0624\u0625\u0626\u0627\u0628\u0629\u062a\u062b\u062c\u062d\u062e\u062f"
    "\u0630\u0631\u0632\u0633\u0634\u0635\u0636\u0637\u0638\u0639\u063a\u063b\u063c\u063d\u063e\u063f"
    "\u0640\u0641\u0642\u0643\u0644\u0645\u0646\u0647\u0648\u0649\u064a\u064b\u064c\u064d\u064e\u064f"
    "\u0650\u0651\u0652\u0653\u0654\u0655\u0656\u0657\u0658\u0659\u065a\u065b\u065c\u065d\u065e\u065f"
    "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669\u066a\u066b\u066c\u066d\u066e\u066f"
    "\u0670\u0671\u0672\u0673\u0674\u0675\u0676\u0677\u0678\u0679\u067a\u067b\u067c\u067d\u067e\u067f"
    "\u0680\u0681\u0682\u0683\u0684\u0685\u0686\u0687\u0688\u0689\u068a\u068b\u068c\u068d\u068e\u068f"
    "\u0690\u0691\u0692\u0693\u0694\u0695\u0696\u0697\u0698\u0699\u069a\u069b\u069c\u069d\u069e\u069f"
    "\u06a0\u06a1\u06a2\u06a3\u06a4\u06a5\u06a6\u06a7\u06a8\u06a9\u06aa\u06ab\u06ac\u06ad\u06ae\u06af"
    "\u06b0\u06b1\u06b2\u06b3\u06b4\u06b5\u06b6\u06b7\u06b8\u06b9\u06ba\u06bb\u06bc\u06bd\u06be\u06bf"
    "\u06c0\u06c1\u06c2\u06c3\u06c4\u06c5\u06c6\u06c7\u06c8\u06c9\u06ca\u06cb\u06cc\u06cd\u06ce\u06cf"
    "\u06d0\u06d1\u06d2\u06d3\u06d4\u06d5\u06d6\u06d7\u06d8\u06d9\u06da\u06db\u06dc\u06dd\u06de\u06df"
    "\u06e0\u06e1\u06e2\u06e3\u06e4\u06e5\u06e6\u06e7\u06e8\u06e9\u06ea\u06eb\u06ec\u06ed\u06ee\u06ef"
    "\u06f0\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7\u06f8\u06f9\u06fa\u06fb\u06fc\u06fd\u06fe\u06ff"
    "\u0750\u0751\u0752\u0753\u0754\u0755\u0756\u0757\u0758\u0759\u075a\u075b\u075c\u075d\u075e\u075f"
    "\u0760\u0761\u0762\u0763\u0764\u0765\u0766\u0767\u0768\u0769\u076a\u076b\u076c\u076d\u076e\u076f"
    "\u0770\u0771\u0772\u0773\u0774\u0775\u0776\u0777\u0778\u0779\u077a\u077b\u077c\u077d\u077e\u077f"
    "\u08a0\u08a1\u08a2\u08a3\u08a4\u08a5\u08a6\u08a7\u08a8\u08a9\u08aa\u08ab\u08ac\u08ad\u08ae\u08af"
    "\u08b0\u08b1\u08b2\u08b3\u08b4\u08b5\u08b6\u08b7\u08b8\u08b9\u08ba\u08bb\u08bc\u08bd\u08be\u08bf"
    "\u08c0\u08c1\u08c2\u08c3\u08c4\u08c5\u08c6\u08c7\u08c8\u08c9\u08ca\u08cb\u08cc\u08cd\u08ce\u08cf"
    "\u08d0\u08d1\u08d2\u08d3\u08d4\u08d5\u08d6\u08d7\u08d8\u08d9\u08da\u08db\u08dc\u08dd\u08de\u08df"
    "\u08e0\u08e1\u08e2\u08e3\u08e4\u08e5\u08e6\u08e7\u08e8\u08e9\u08ea\u08eb\u08ec\u08ed\u08ee\u08ef"
    "\u08f0\u08f1\u08f2\u08f3\u08f4\u08f5\u08f6\u08f7\u08f8\u08f9\u08fa\u08fb\u08fc\u08fd\u08fe\u08ff"
    "\ufb50\ufb51\ufb52\ufb53\ufb54\ufb55\ufb56\ufb57\ufb58\ufb59\ufb5a\ufb5b\ufb5c\ufb5d\ufb5e\ufb5f"
    "\ufb60\ufb61\ufb62\ufb63\ufb64\ufb65\ufb66\ufb67\ufb68\ufb69\ufb6a\ufb6b\ufb6c\ufb6d\ufb6e\ufb6f"
    "\ufb70\ufb71\ufb72\ufb73\ufb74\ufb75\ufb76\ufb77\ufb78\ufb79\ufb7a\ufb7b\ufb7c\ufb7d\ufb7e\ufb7f"
    "\ufb80\ufb81\ufb82\ufb83\ufb84\ufb85\ufb86\ufb87\ufb88\ufb89\ufb8a\ufb8b\ufb8c\ufb8d\ufb8e\ufb8f"
    "\ufb90\ufb91\ufb92\ufb93\ufb94\ufb95\ufb96\ufb97\ufb98\ufb99\ufb9a\ufb9b\ufb9c\ufb9d\ufb9e\ufb9f"
    "\ufba0\ufba1\ufba2\ufba3\ufba4\ufba5\ufba6\ufba7\ufba8\ufba9\ufbaa\ufbab\ufbac\ufbad\ufbae\ufbaf"
    "\ufbb0\ufbb1\ufbb2\ufbb3\ufbb4\ufbb5\ufbb6\ufbb7\ufbb8\ufbb9\ufbba\ufbbb\ufbbc\ufbbd\ufbbe\ufbbf"
    "\ufbc0\ufbc1\ufbc2\ufbc3\ufbc4\ufbc5\ufbc6\ufbc7\ufbc8\ufbc9\ufbca\ufbcb\ufbcc\ufbcd\ufbce\ufbcf"
    "\ufbd0\ufbd1\ufbd2\ufbd3\ufbd4\ufbd5\ufbd6\ufbd7\ufbd8\ufbd9\ufbda\ufbdb\ufbdc\ufbdd\ufbde\ufbdf"
    "\ufbe0\ufbe1\ufbe2\ufbe3\ufbe4\ufbe5\ufbe6\ufbe7\ufbe8\ufbe9\ufbea\ufbeb\ufbec\ufbed\ufbee\ufbef"
    "\ufbf0\ufbf1\ufbf2\ufbf3\ufbf4\ufbf5\ufbf6\ufbf7\ufbf8\ufbf9\ufbfa\ufbfb\ufbfc\ufbfd\ufbfe\ufbff"
    "\ufe70\ufe71\ufe72\ufe73\ufe74\ufe75\ufe76\ufe77\ufe78\ufe79\ufe7a\ufe7b\ufe7c\ufe7d\ufe7e\ufe7f"
    "\ufdfa\ufdfb"
    "\u200c\u200d\u200e\u200f\u2010\u2011\u2013\u2014"
)

LATIN_CORE = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "".join(chr(c) for c in range(0xA0, 0x100))
    + "‐‑–—‘’“”…·×‹›§©®°±"
)

CHECKS = {
    "cormorant": ("Ḥḥāīūṣḍṭẓʻʿʾʼ", None),
    "archivo": (LATIN_CORE, None),
    "amiri": ("ﷺبدرأحدالخندق", ARABIC),
    "nastaliq": ("اردوٹائم لائن", URDU),
}


def write_text(name: str, text: str) -> pathlib.Path:
    TMP.mkdir(parents=True, exist_ok=True)
    p = TMP / f"{name}.txt"
    p.write_text(text, encoding="utf-8")
    return p


def subset(src: pathlib.Path, name: str, text: str) -> pathlib.Path:
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{name}.woff2"
    text_file = write_text(name, text)
    cmd = [
        sys.executable, "-m", "fontTools.subset", str(src),
        f"--text-file={text_file}",
        f"--output-file={out}",
        "--flavor=woff2",
        "--layout-features=*",
        "--no-hinting",
        "--desubroutinize",
        "--glyph-names",
        "--symbol-cmap",
        "--legacy-cmap",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
        "--name-IDs=*",
        "--name-legacy",
        "--name-languages=*",
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
    return out


def check(path: pathlib.Path, required: str) -> None:
    font = TTFont(path)
    cmap = font.getBestCmap()
    missing = [ch for ch in required if ord(ch) not in cmap]
    if missing:
        raise SystemExit(f"{path.name}: missing {missing!r}")
    size = path.stat().st_size
    print(f"{path.name:22} {size/1024:7.1f} KB  {len(cmap):5} codepoints  U+FDFA={0xFDFA in cmap}")


def main() -> None:
    if not all(p.exists() for p in (SRC_CORMORANT, SRC_ARCHIVO, SRC_AMIRI, SRC_NASTALIQ)):
        raise SystemExit("font sources missing: expected /tmp/fonts and /usr/share/fonts")

    paths = {
        "cormorant": subset(SRC_CORMORANT, "cormorant", LATIN_CORE + "ĀāĪīŪūḤḥṢṣḌḍṬṭẒẓʿʻʾʼ"),
        "archivo": subset(SRC_ARCHIVO, "archivo", LATIN_CORE),
        "amiri": subset(SRC_AMIRI, "amiri", ARABIC),
        "nastaliq": subset(SRC_NASTALIQ, "nastaliq", URDU),
    }
    for key, (required, _) in CHECKS.items():
        check(paths[key], required)
    (OUT / "fonts.css").write_text(
        """/* The Seerah Atlas · self-hosted faces. No third-party font requests. */
@font-face {
  font-family: "Cormorant Garamond";
  src: url("cormorant.woff2") format("woff2");
  font-weight: 300 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Archivo";
  src: url("archivo.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Amiri";
  src: url("amiri.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F;
}
@font-face {
  font-family: "Noto Nastaliq Urdu";
  src: url("nastaliq.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F;
}
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
