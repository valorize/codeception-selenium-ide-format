#!/usr/bin/env bash

SCRIPTNAME=$(readlink -f $0)
BASEDIR=$(dirname $SCRIPTNAME)
cd $BASEDIR/src

zip -r install.xpi * -x \*.xpi
