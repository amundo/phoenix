m2h --section-divs=true
generate-toc
rsync --delete --exclude-from=exclude-from.txt  -rtpzv /Users/pathall/Sites/Games/phoenix/ ruphusco@ruphus.com:ruphus.com/phoenix/
