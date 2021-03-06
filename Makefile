TARGET		= libtformat.a

SRC		= $(shell find sources -name '*.cc' -a -not -name '*.test.cc' -a -not -name 'nbind.cc')
TESTS		= $(shell find sources -name '*.test.cc' -a -not -name 'nbind.cc')

OBJ_SRC		= $(SRC:%.cc=%.o)
OBJ_TESTS	= $(TESTS:%.cc=%.o)

DEPS		= $(SRC:%.cc=%.d) $(TESTS:%.cc=%.d)

RM		= rm -f
CXX		?= clang++

CXXFLAGS	= -std=c++14 -W -Wall -Werror -MMD

NODEPS		= clean fclean
.PHONY		: all clean fclean re test

ifeq (0, $(words $(findstring $(MAKECMDGOALS), $(NODEPS))))
-include $(DEPS)
endif

ifeq ($(DEBUG),1)
CXXFLAGS	+= -g -O0
CPPFLAGS	+= -DDEBUG
endif

all:		$(TARGET)

clean:
		$(RM) $(shell find . -name '*.o')
		$(RM) $(shell find . -name '*.d')

fclean:		clean
		$(RM) $(TARGET)

re:		clean
		$(MAKE) all

test:		$(OBJ_SRC) $(OBJ_TESTS)
		$(CXX) $(CXXFLAGS) $(CPPFLAGS) -o /tmp/testsuite $(OBJ_SRC) $(OBJ_TESTS)
		/tmp/testsuite

$(TARGET):	$(OBJ_SRC)
		ar rf $(TARGET) $(OBJ_SRC)
		ranlib $(TARGET)
