from random import choice

def flip_single():
    return choice([2, 3])

def flip_three():
    return sum(flip_single() for _ in range(3))

def get_heagram():
    h = '█'*5
    x = ' '*5
    for _ in range(6):
        result = flip_three()
        if result == 6:
            # changing yin
            print(h + h + h)
        elif result == 7:
            print(h + h + h)
        elif result == 8:
            print(h + x + h)
        elif result == 9:
            print(h + x + h)
        print()

get_heagram()
