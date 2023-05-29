#/bin/bash


function help_and_quit {
  echo ""
  echo "Help:"
  echo ""
  echo "increases numbers in files by a given value, and runs git mv on them"
  echo "usage:"
  echo "$0 start increate [-s]"
  echo ""
  echo "start - number of the first file to be processed, eg. 107 which for V1.0.0.0107__..."
  echo "increate - the increate value"
  echo "-s - just simulate"
  exit 1
}




STARTNUMBER=$1
INCREASE=$2




if [ $# -lt 2 ]
then
        echo "error check number of params"
        help_and_quit
fi

if [ $# -ge 3 ]
then
        if [ "$3" == "-s" ]
        then 
              GITOPTION="-n"
        else
              echo "unknown parameter $3"
              help_and_quit
        fi      
else 
        GITOPTION="-v"
fi




for OLDNAME in V*.sql
do
        PREFIX=${OLDNAME:0:7}
        OLDNUMBER=${OLDNAME:8:3} 
        SUFFIX=${OLDNAME:11}
        if [ $OLDNUMBER -ge $STARTNUMBER ] 
        then        
                NEWNUMBERSTRING=$(printf "%04d" $((10#$OLDNUMBER+$INCREASE)))      
                NEWNAME=$PREFIX$NEWNUMBERSTRING$SUFFIX
                git mv $GITOPTION $OLDNAME $NEWNAME
        fi
done
