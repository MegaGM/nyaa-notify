#!/bin/bash

echo "downloadAndOpenTorrent.sh $1"

case "$OSTYPE" in
  cygwin*)
    cmd /c start "$1"
  ;;
  linux*)
    xdg-open "$1"
  ;;
  darwin*)
    open "$1"
  ;;
esac
