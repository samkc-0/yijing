import time
from ctext import *
import json
import random

chapters=[
'qian',
'kun',
'zhun',
'meng',
'xu',
'song',
'shi',
'bi',
'xiao-xu',
'lu',
'tai',
'pi',
'tong-ren',
'da-you',
'qian1',
'yu',
'sui',
'gu',
'guan',
'lin',
'shi-he',
'bi1',
'bo',
'fu',
'wu-wang',
'da-xu',
'yi',
'da-guo',
'kan',
'li',
'xian',
'heng',
'dun',
'da-zhuang',
'jin',
'ming-yi',
'jia-ren',
'kui',
'jian',
'jie',
'sun',
'yi1',
'guai',
'gou',
'cui',
'sheng',
'kun1',
'jing',
'ge',
'ding',
'zhen',
'gen',
'jian1',
'gui-mei',
'feng',
'lu1',
'xun',
'dui',
'huan',
'jie1',
'zhong-fu',
'xiao-guo',
'ji-ji',
'wei-ji',
]
import os
assert len(chapters) == len(set(chapters))
total = len(chapters)
for i, ch in enumerate(chapters, 1):

    n = str(i).zfill(2)
    filename = os.path.join(".", "data", f"{n}_{ch}.json")
    if os.path.exists(filename):
        continue
    print(f"downloading {i}/{total}: {ch}")
    urn = f"ctp:book-of-changes/{ch}"
    para = gettextasparagraphlist(urn)
    with open(filename, "w") as f:
        json.dump(para, f, ensure_ascii=False)
    time.sleep(1 + random.random())
    

