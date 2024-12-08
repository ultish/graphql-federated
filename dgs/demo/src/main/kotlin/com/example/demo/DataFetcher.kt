package com.example.demo


import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.DgsSubscription
import com.netflix.graphql.dgs.InputArgument
import org.reactivestreams.Publisher
import reactor.core.publisher.Flux
import java.time.Duration
import java.util.function.Function

@DgsComponent
class ShowsDataFetcher {
    private val shows = listOf(
        Show("Stranger Things", 2016),
        Show("Ozark", 2017),
        Show("The Crown", 2016),
        Show("Dead to Me", 2019),
        Show("Orange is the New Black", 2013)
    )

    @DgsQuery
    fun shows(@InputArgument titleFilter: String?): List<Show> {
        return if (titleFilter != null) {
            shows.filter { it.title.contains(titleFilter) }
        } else {
            shows
        }
    }

    data class Show(val title: String, val releaseYear: Int)
}


@DgsComponent
class TestSub {
    @DgsSubscription
    fun hello(): Publisher<String> {
        return Flux.interval(
            Duration.ofSeconds(0),
            Duration.ofSeconds(1)
        )
            .map<String>(Function<Long, String> { t: Long ->
                "hello ${500 + t}"
            })
    }
}