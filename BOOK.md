This is an interactive compy of the Yijing.

Text content can be found in @book/data/

The only colors used are a white bg with black text.

All is perfectly centered in the viewport.

contents page/component:
The contents page is just hexagrams, and you click on a hexagram to go to a chapter.
The hexagrams are moving like matrix rain and infinite and tightly packed, but all the same size. And they do not look like rain because when they fall through the bottom they come out the top.

chapter page/component:
it is just the 6 lines of the chapter, lined up over a big version of their hexagram. You go back to the contents page (the one with the hexagrams) by clicking outside the text body.

the book should be designed such that it is easy to redesign chapters/components later. i.e. swap out the chapter component file with a different one, and we will still be able to render from contents, and vice versa.
